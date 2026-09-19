package com.careerhub.student;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface StudentEducationRepository extends JpaRepository<StudentEducation, UUID> {
    List<StudentEducation> findByStudentIdOrderByEndYearDesc(UUID studentId);
    long countByStudentId(UUID studentId);
}
