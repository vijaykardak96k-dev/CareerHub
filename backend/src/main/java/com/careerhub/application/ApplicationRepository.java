package com.careerhub.application;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ApplicationRepository extends JpaRepository<Application, UUID> {

    boolean existsByStudentIdAndJobId(UUID studentId, UUID jobId);

    boolean existsByStudentIdAndInternshipId(UUID studentId, UUID internshipId);

    @Query("""
           select a from Application a
           join fetch a.student s join fetch s.user
           left join fetch a.job j left join fetch j.company
           left join fetch a.internship i left join fetch i.company
           where a.id = :id
           """)
    Optional<Application> findDetailed(@Param("id") UUID id);

    @Query(value = """
           select a from Application a
           join fetch a.student s join fetch s.user
           left join fetch a.job j left join fetch j.company
           left join fetch a.internship i left join fetch i.company
           where a.student.id = :studentId
             and (:status is null or a.status = :status)
           """,
           countQuery = """
           select count(a) from Application a
           where a.student.id = :studentId and (:status is null or a.status = :status)
           """)
    Page<Application> findByStudent(@Param("studentId") UUID studentId,
                                    @Param("status") ApplicationStatus status,
                                    Pageable pageable);

    @Query(value = """
           select a from Application a
           join fetch a.student s join fetch s.user
           left join fetch a.job j left join fetch j.company
           left join fetch a.internship i left join fetch i.company
           where (j.company.id = :companyId or i.company.id = :companyId)
             and (:status is null or a.status = :status)
             and (:jobId is null or j.id = :jobId)
             and (:internshipId is null or i.id = :internshipId)
           """,
           countQuery = """
           select count(a) from Application a
           left join a.job j left join a.internship i
           where (j.company.id = :companyId or i.company.id = :companyId)
             and (:status is null or a.status = :status)
             and (:jobId is null or j.id = :jobId)
             and (:internshipId is null or i.id = :internshipId)
           """)
    Page<Application> findForCompany(@Param("companyId") UUID companyId,
                                     @Param("status") ApplicationStatus status,
                                     @Param("jobId") UUID jobId,
                                     @Param("internshipId") UUID internshipId,
                                     Pageable pageable);

    @Query(value = """
           select a from Application a
           join fetch a.student s join fetch s.user
           left join fetch a.job j left join fetch j.company
           left join fetch a.internship i left join fetch i.company
           where (:status is null or a.status = :status)
           """,
           countQuery = "select count(a) from Application a where (:status is null or a.status = :status)")
    Page<Application> findAllForAdmin(@Param("status") ApplicationStatus status, Pageable pageable);

    long countByStudentIdAndStatusIn(UUID studentId, Collection<ApplicationStatus> statuses);

    long countByStatus(ApplicationStatus status);

    @Query("""
           select count(a) from Application a left join a.job j left join a.internship i
           where j.company.id = :companyId or i.company.id = :companyId
           """)
    long countByCompany(@Param("companyId") UUID companyId);

    @Query("""
           select count(a) from Application a left join a.job j left join a.internship i
           where (j.company.id = :companyId or i.company.id = :companyId) and a.status = :status
           """)
    long countByCompanyAndStatus(@Param("companyId") UUID companyId, @Param("status") ApplicationStatus status);

    @Query("select a.status, count(a) from Application a group by a.status")
    List<Object[]> countGroupedByStatus();
}
