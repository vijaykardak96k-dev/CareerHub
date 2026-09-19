package com.careerhub.certificate;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CertificateRepository extends JpaRepository<Certificate, UUID> {

    List<Certificate> findByStudentIdOrderByCreatedAtDesc(UUID studentId);

    long countByStudentId(UUID studentId);

    long countByStudentIdAndStatus(UUID studentId, CertificateStatus status);

    long countByStatus(CertificateStatus status);

    @Query("select c from Certificate c join fetch c.student s join fetch s.user where c.id = :id")
    Optional<Certificate> findDetailed(@Param("id") UUID id);

    @Query(value = """
           select c from Certificate c join fetch c.student s join fetch s.user
           where (:status is null or c.status = :status)
           """,
           countQuery = "select count(c) from Certificate c where (:status is null or c.status = :status)")
    Page<Certificate> findAllForAdmin(@Param("status") CertificateStatus status, Pageable pageable);
}
