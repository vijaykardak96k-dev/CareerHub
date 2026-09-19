package com.careerhub.company;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface CompanyRepository extends JpaRepository<Company, UUID> {

    @Query("select c from Company c join fetch c.user u where u.id = :userId")
    Optional<Company> findByUserId(@Param("userId") UUID userId);

    @Query("select c from Company c join fetch c.user u where c.id = :id")
    Optional<Company> findDetailed(@Param("id") UUID id);

    long countByStatus(CompanyStatus status);

    @Query("""
           select c from Company c join fetch c.user
           where (:status is null or c.status = :status)
             and (:search is null or lower(c.name) like lower(concat('%', :search, '%')))
           """)
    Page<Company> search(@Param("status") CompanyStatus status,
                         @Param("search") String search,
                         Pageable pageable);
}
