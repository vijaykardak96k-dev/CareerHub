-- Jobs bookmarked by a student from the job board.
CREATE TABLE saved_jobs (
    id         UUID PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students (id) ON DELETE CASCADE,
    job_id     UUID NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_saved_job UNIQUE (student_id, job_id)
);
CREATE INDEX idx_saved_jobs_student ON saved_jobs (student_id);
