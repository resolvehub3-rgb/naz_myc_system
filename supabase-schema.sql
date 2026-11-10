-- ==============================================================================
-- METHODIST CHURCH GHANA – MYC (METHODIST YOUTH CLUB)
-- DIGITAL ATTENDANCE MANAGEMENT SYSTEM DATABASE SCHEMA & RLS
-- PostgreSQL / Supabase Migration
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Profiles and Roles Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'attendance_officer')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Church Members Table
CREATE TABLE IF NOT EXISTS public.members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    membership_number TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    telephone TEXT NOT NULL,
    email TEXT,
    photo_url TEXT,
    registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
    membership_status TEXT NOT NULL DEFAULT 'active' CHECK (membership_status IN ('active', 'inactive', 'suspended')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. QR Credentials Table
CREATE TABLE IF NOT EXISTS public.qr_credentials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    member_id UUID NOT NULL REFERENCES public.members(id) ON DELETE CASCADE,
    credential_hash TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    issued_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ
);

-- 5. Attendance Sessions Table
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_name TEXT NOT NULL,
    activity_type TEXT NOT NULL CHECK (activity_type IN (
        'Sunday Service',
        'MYC Meeting',
        'Youth Fellowship',
        'Bible Study',
        'Prayer Meeting',
        'Choir Rehearsal',
        'Church Committee Meeting',
        'Special Church Events'
    )),
    meeting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIME NOT NULL,
    end_time TIME,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Visitors & Walk-Ins Table
CREATE TABLE IF NOT EXISTS public.visitors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    telephone TEXT,
    email TEXT,
    session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    visitor_type TEXT NOT NULL DEFAULT 'first_timer' CHECK (visitor_type IN ('first_timer', 'returning_visitor', 'walk_in')),
    arrival_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'attended',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Attendance Records Table
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    member_id UUID REFERENCES public.members(id) ON DELETE SET NULL,
    visitor_id UUID REFERENCES public.visitors(id) ON DELETE SET NULL,
    attendance_method TEXT NOT NULL CHECK (attendance_method IN (
        'QR Scan',
        'Manual Member Search',
        'Walk-in Registration',
        'Visitor Registration'
    )),
    arrival_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    recorded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Constraint: prevent duplicate check-in for the same member in the same session
    CONSTRAINT uq_session_member UNIQUE (session_id, member_id),
    -- Constraint: ensure either member_id or visitor_id is provided
    CONSTRAINT chk_member_or_visitor CHECK (member_id IS NOT NULL OR visitor_id IS NOT NULL)
);

-- 8. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    previous_values JSONB,
    new_values JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR HIGH-SPEED LOOKUP & PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_members_number ON public.members(membership_number);
CREATE INDEX IF NOT EXISTS idx_members_telephone ON public.members(telephone);
CREATE INDEX IF NOT EXISTS idx_members_full_name ON public.members(full_name);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON public.attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_member ON public.attendance_records(member_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_arrival ON public.attendance_records(arrival_timestamp);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON public.attendance_sessions(meeting_date);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_status ON public.attendance_sessions(status);
CREATE INDEX IF NOT EXISTS idx_visitors_session ON public.visitors(session_id);

-- ==============================================================================
-- ATOMIC FUNCTIONS
-- ==============================================================================

-- Generates next membership number securely (e.g. MYC-000001)
CREATE OR REPLACE FUNCTION public.generate_next_membership_number()
RETURNS TEXT AS $$
DECLARE
    next_num INT;
    formatted TEXT;
BEGIN
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(membership_number FROM '[0-9]+') AS INT)
    ), 0) + 1
    INTO next_num
    FROM public.members
    WHERE membership_number ~ '^(MYC|MCG)-?[0-9]+$';

    formatted := 'MYC-' || LPAD(next_num::TEXT, 6, '0');
    RETURN formatted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin' AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Authenticated users can view profiles; admins can manage profiles
CREATE POLICY "Users can view active profiles"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can update and insert profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.is_admin() OR auth.uid() = id);

-- Members: Authenticated users can view; Admins can insert/update/delete
CREATE POLICY "Authenticated users can view members"
    ON public.members FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage members"
    ON public.members FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- QR Credentials: Viewable by authenticated staff, manageable by admins
CREATE POLICY "Authenticated staff can view QR credentials"
    ON public.qr_credentials FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage QR credentials"
    ON public.qr_credentials FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Attendance Sessions: Viewable by authenticated; Admins can manage
CREATE POLICY "Authenticated staff can view attendance sessions"
    ON public.attendance_sessions FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Admins can manage attendance sessions"
    ON public.attendance_sessions FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Attendance Records: Viewable by authenticated; Staff can record for active sessions
CREATE POLICY "Authenticated staff can view attendance records"
    ON public.attendance_records FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated staff can insert attendance records"
    ON public.attendance_records FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.attendance_sessions
            WHERE id = session_id AND status = 'active'
        )
    );

CREATE POLICY "Admins can manage attendance records"
    ON public.attendance_records FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Visitors: Viewable and insertable by authenticated staff
CREATE POLICY "Authenticated staff can view visitors"
    ON public.visitors FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated staff can insert visitors"
    ON public.visitors FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Admins can manage visitors"
    ON public.visitors FOR ALL
    TO authenticated
    USING (public.is_admin());

-- Audit logs: Viewable by admins; Insertable by system
CREATE POLICY "Admins can view audit logs"
    ON public.audit_logs FOR SELECT
    TO authenticated
    USING (public.is_admin());

CREATE POLICY "Authenticated users can create audit logs"
    ON public.audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- ==============================================================================
-- REALTIME SUBSCRIPTIONS
-- ==============================================================================
-- Add tables to realtime publication for live updates
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'attendance_records'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'attendance_sessions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_sessions;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'members'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.members;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND tablename = 'visitors'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.visitors;
    END IF;
END $$;
