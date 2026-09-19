package com.careerhub.internship;

import com.careerhub.job.OpeningStatus;
import com.careerhub.job.WorkMode;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface InternshipRepository extends JpaRepository<Internship, UUID> {

    @Query("select i from Internship i join fetch i.company left join fetch i.skills where i.id = :id")
    Optional<Internship> findDetailed(@Param("id") UUID id);

    @Query(value = """
           select i from Internship i join fetch i.company c
           where i.status = com.careerhub.job.OpeningStatus.PUBLISHED
             and (:search is null or lower(i.title) like lower(concat('%', :search, '%'))
                  or lower(c.name) like lower(concat('%', :search, '%')))
             and (:location is null or lower(i.location) like lower(concat('%', :location, '%')))
             and (:workMode is null or i.workMode = :workMode)
           """,
           countQuery = """
           select count(i) from Internship i
           where i.status = com.careerhub.job.OpeningStatus.PUBLISHED
             and (:search is null or lower(i.title) like lower(concat('%', :search, '%'))
                  or lower(i.company.name) like lower(concat('%', :search, '%')))
             and (:location is null or lower(i.location) like lower(concat('%', :location, '%')))
             and (:workMode is null or i.workMode = :workMode)
           """)
    Page<Internship> searchPublished(@Param("search") String search,
                                     @Param("location") String location,
                                     @Param("workMode") WorkMode workMode,
                                     Pageable pageable);

    @Query(value = "select i from Internship i join fetch i.company where i.company.id = :companyId",
           countQuery = "select count(i) from Internship i where i.company.id = :companyId")
    Page<Internship> findByCompany(@Param("companyId") UUID companyId, Pageable pageable);

    @Query(value = "select i from Internship i join fetch i.company where (:status is null or i.status = :status)",
           countQuery = "select count(i) from Internship i where (:status is null or i.status = :status)")
    Page<Internship> findAllForAdmin(@Param("status") OpeningStatus status, Pageable pageable);

    long countByCompanyId(UUID companyId);
    long countByCompanyIdAndStatus(UUID companyId, OpeningStatus status);
    long countByStatus(OpeningStatus status);
}
