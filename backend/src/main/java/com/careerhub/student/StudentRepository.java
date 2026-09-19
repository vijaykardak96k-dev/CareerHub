package com.careerhub.student;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface StudentRepository extends JpaRepository<Student, UUID> {

    @Query("select s from Student s join fetch s.user u where u.id = :userId")
    Optional<Student> findByUserId(@Param("userId") UUID userId);

    @Query("select s from Student s join fetch s.user u where s.id = :id")
    Optional<Student> findDetailed(@Param("id") UUID id);

    @Query("""
           select s from Student s join fetch s.user u
           where (:search is null or lower(s.fullName) like lower(concat('%', :search, '%'))
                  or lower(u.email) like lower(concat('%', :search, '%')))
           """)
    Page<Student> search(@Param("search") String search, Pageable pageable);
}
