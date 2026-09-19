package com.careerhub.student;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SavedJobRepository extends JpaRepository<SavedJob, UUID> {

    @Query("""
           select sj from SavedJob sj join fetch sj.job j join fetch j.company
           where sj.student.id = :studentId
           order by sj.createdAt desc
           """)
    List<SavedJob> findByStudent(@Param("studentId") UUID studentId);

    Optional<SavedJob> findByStudentIdAndJobId(UUID studentId, UUID jobId);

    boolean existsByStudentIdAndJobId(UUID studentId, UUID jobId);
}
