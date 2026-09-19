package com.careerhub.assessment;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AssessmentRepository extends JpaRepository<Assessment, UUID> {

    @Query("select a from Assessment a join fetch a.skill where a.active = true order by a.title")
    List<Assessment> findActive();

    @Query("select a from Assessment a join fetch a.skill order by a.title")
    List<Assessment> findAllWithSkill();

    @Query("select a from Assessment a join fetch a.skill where a.id = :id")
    Optional<Assessment> findDetailed(@Param("id") UUID id);
}
