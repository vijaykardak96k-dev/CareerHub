package com.careerhub.skill;

import com.careerhub.security.CurrentUser;
import com.careerhub.student.StudentService;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/skills")
@Tag(name = "Skills")
public class SkillController {

    private final SkillService service;
    private final StudentService studentService;
    private final CurrentUser currentUser;

    public SkillController(SkillService service, StudentService studentService, CurrentUser currentUser) {
        this.service = service;
        this.studentService = studentService;
        this.currentUser = currentUser;
    }

    /** Public skill catalogue, also used by the registration and job filter screens. */
    @GetMapping("/catalog")
    public List<SkillDtos.CategoryView> catalog() {
        return service.catalog();
    }

    @GetMapping
    public List<SkillDtos.SkillView> all() {
        return service.allSkills();
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('STUDENT')")
    public List<SkillDtos.StudentSkillView> mine() {
        return service.studentSkills(studentService.requireByUser(currentUser.require()));
    }

    @PostMapping("/mine")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<SkillDtos.StudentSkillView> add(@Valid @RequestBody SkillDtos.StudentSkillRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.addStudentSkill(currentUser.require(), request));
    }

    @PutMapping("/mine/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    public SkillDtos.StudentSkillView update(@PathVariable UUID id,
                                             @Valid @RequestBody SkillDtos.StudentSkillRequest request) {
        return service.updateStudentSkill(currentUser.require(), id, request);
    }

    @DeleteMapping("/mine/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<Void> remove(@PathVariable UUID id) {
        service.removeStudentSkill(currentUser.require(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/gap/job/{jobId}")
    @PreAuthorize("hasRole('STUDENT')")
    public SkillDtos.SkillGapView jobGap(@PathVariable UUID jobId) {
        return service.gapForJob(currentUser.require(), jobId);
    }

    @GetMapping("/gap/internship/{internshipId}")
    @PreAuthorize("hasRole('STUDENT')")
    public SkillDtos.SkillGapView internshipGap(@PathVariable UUID internshipId) {
        return service.gapForInternship(currentUser.require(), internshipId);
    }
}
