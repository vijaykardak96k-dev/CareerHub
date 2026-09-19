package com.careerhub.assessment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AssessmentAttemptRepository extends JpaRepository<AssessmentAttempt, UUID> {

    @Query("""
           select a from AssessmentAttempt a
           join fetch a.assessment ass join fetch ass.skill
           where a.student.id = :studentId
           order by a.attemptedAt desc
           """)
    List<AssessmentAttempt> findByStudent(@Param("studentId") UUID studentId);

    long countByStudentId(UUID studentId);

    @Query("select avg(a.percentage) from AssessmentAttempt a where a.student.id = :studentId")
    Double averagePercentage(@Param("studentId") UUID studentId);
}
