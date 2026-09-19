package com.careerhub.student;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface StudentExperienceRepository extends JpaRepository<StudentExperience, UUID> {
    List<StudentExperience> findByStudentIdOrderByStartDateDesc(UUID studentId);
    long countByStudentId(UUID studentId);
}
