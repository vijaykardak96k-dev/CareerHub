package com.careerhub.job;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JobRepository extends JpaRepository<Job, UUID> {

    @Query("""
           select j
           from Job j
           join fetch j.company
           left join fetch j.skills
           where j.id = :id
           """)
    Optional<Job> findDetailed(@Param("id") UUID id);

    @Query(value = """
           select j
           from Job j
           join fetch j.company c
           where j.status = com.careerhub.job.OpeningStatus.PUBLISHED
             and (
                  :search is null
                  or lower(j.title) like lower(concat('%', cast(:search as string), '%'))
                  or lower(c.name) like lower(concat('%', cast(:search as string), '%'))
             )
             and (
                  :location is null
                  or lower(j.location) like lower(concat('%', cast(:location as string), '%'))
             )
             and (:workMode is null or j.workMode = :workMode)
             and (:employmentType is null or j.employmentType = :employmentType)
           """,
           countQuery = """
           select count(j)
           from Job j
           where j.status = com.careerhub.job.OpeningStatus.PUBLISHED
             and (
                  :search is null
                  or lower(j.title) like lower(concat('%', cast(:search as string), '%'))
                  or lower(j.company.name) like lower(concat('%', cast(:search as string), '%'))
             )
             and (
                  :location is null
                  or lower(j.location) like lower(concat('%', cast(:location as string), '%'))
             )
             and (:workMode is null or j.workMode = :workMode)
             and (:employmentType is null or j.employmentType = :employmentType)
           """)
    Page<Job> searchPublished(
            @Param("search") String search,
            @Param("location") String location,
            @Param("workMode") WorkMode workMode,
            @Param("employmentType") EmploymentType employmentType,
            Pageable pageable);

    @Query(value = """
           select j
           from Job j
           join fetch j.company
           where j.company.id = :companyId
           """,
           countQuery = """
           select count(j)
           from Job j
           where j.company.id = :companyId
           """)
    Page<Job> findByCompany(
            @Param("companyId") UUID companyId,
            Pageable pageable);

    @Query(value = """
           select j
           from Job j
           join fetch j.company c
           where (:status is null or j.status = :status)
           """,
           countQuery = """
           select count(j)
           from Job j
           where (:status is null or j.status = :status)
           """)
    Page<Job> findAllForAdmin(
            @Param("status") OpeningStatus status,
            Pageable pageable);

    long countByCompanyId(UUID companyId);

    long countByCompanyIdAndStatus(
            UUID companyId,
            OpeningStatus status);

    long countByStatus(OpeningStatus status);

    @Query("""
           select distinct j
           from Job j
           join fetch j.company
           where j.status = com.careerhub.job.OpeningStatus.PUBLISHED
             and exists (
                 select 1
                 from j.skills s
                 where s.id in :skillIds
             )
           order by j.createdAt desc
           """)
    List<Job> findRecommended(
            @Param("skillIds") List<UUID> skillIds,
            Pageable pageable);

    @Query("""
           select function('to_char', j.createdAt, 'YYYY-MM'),
                  count(j)
           from Job j
           group by function('to_char', j.createdAt, 'YYYY-MM')
           order by function('to_char', j.createdAt, 'YYYY-MM')
           """)
    List<Object[]> countByMonth();
}
