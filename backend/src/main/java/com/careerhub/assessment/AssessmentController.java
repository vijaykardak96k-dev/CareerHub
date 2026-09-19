package com.careerhub.assessment;

import com.careerhub.security.CurrentUser;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/assessments")
@Tag(name = "Assessments")
public class AssessmentController {

    private final AssessmentService service;
    private final CurrentUser currentUser;

    public AssessmentController(AssessmentService service, CurrentUser currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    @GetMapping
    public List<AssessmentDtos.AssessmentView> list() {
        return service.listActive();
    }

    @GetMapping("/{id}/start")
    @PreAuthorize("hasRole('STUDENT')")
    public AssessmentDtos.AttemptStart start(@PathVariable UUID id) {
        return service.start(id);
    }

    @PostMapping("/{id}/submit")
    @PreAuthorize("hasRole('STUDENT')")
    public AssessmentDtos.AttemptResult submit(@PathVariable UUID id,
                                               @Valid @RequestBody AssessmentDtos.SubmitRequest request) {
        return service.submit(currentUser.require(), id, request);
    }

    @GetMapping("/results")
    @PreAuthorize("hasRole('STUDENT')")
    public List<AssessmentDtos.AttemptResult> results() {
        return service.results(currentUser.require());
    }
}
