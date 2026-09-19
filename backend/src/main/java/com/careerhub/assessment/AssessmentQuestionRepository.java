package com.careerhub.assessment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.UUID;

public interface AssessmentQuestionRepository extends JpaRepository<AssessmentQuestion, UUID> {

    @Query("""
           select distinct q from AssessmentQuestion q
           left join fetch q.options
           where q.assessment.id = :assessmentId
           order by q.position
           """)
    List<AssessmentQuestion> findWithOptions(@Param("assessmentId") UUID assessmentId);

    long countByAssessmentId(UUID assessmentId);
}
