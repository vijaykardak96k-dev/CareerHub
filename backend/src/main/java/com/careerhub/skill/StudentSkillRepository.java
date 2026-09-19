package com.careerhub.skill;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface StudentSkillRepository extends JpaRepository<StudentSkill, UUID> {

    @Query("select ss from StudentSkill ss join fetch ss.skill sk join fetch sk.category where ss.student.id = :studentId order by sk.name")
    List<StudentSkill> findByStudent(UUID studentId);

    boolean existsByStudentIdAndSkillId(UUID studentId, UUID skillId);

    long countByStudentId(UUID studentId);

    @Query("select sk.name, count(ss) from StudentSkill ss join ss.skill sk group by sk.name order by count(ss) desc")
    List<Object[]> countStudentsPerSkill();
}
