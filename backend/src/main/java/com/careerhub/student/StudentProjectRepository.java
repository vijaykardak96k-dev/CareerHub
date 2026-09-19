package com.careerhub.student;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface StudentProjectRepository extends JpaRepository<StudentProject, UUID> {
    List<StudentProject> findByStudentIdOrderByCreatedAtDesc(UUID studentId);
    long countByStudentId(UUID studentId);
}
