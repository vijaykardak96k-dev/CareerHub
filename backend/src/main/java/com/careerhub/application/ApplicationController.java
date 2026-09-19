package com.careerhub.application;

import com.careerhub.config.PageResponse;
import com.careerhub.security.CurrentUser;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/applications")
@Tag(name = "Applications")
public class ApplicationController {

    private final ApplicationService service;
    private final CurrentUser currentUser;

    public ApplicationController(ApplicationService service, CurrentUser currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    @PostMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApplicationDtos.ApplicationView> apply(
            @Valid @RequestBody ApplicationDtos.ApplyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.apply(currentUser.require(), request));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('STUDENT')")
    public PageResponse<ApplicationDtos.ApplicationView> mine(
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return service.listForStudent(currentUser.require(), status,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "appliedAt")));
    }

    @GetMapping("/company")
    @PreAuthorize("hasRole('COMPANY')")
    public PageResponse<ApplicationDtos.ApplicationView> forCompany(
            @RequestParam(required = false) ApplicationStatus status,
            @RequestParam(required = false) UUID jobId,
            @RequestParam(required = false) UUID internshipId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return service.listForCompany(currentUser.require(), status, jobId, internshipId,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "appliedAt")));
    }

    @GetMapping("/{id}")
    public ApplicationDtos.ApplicationView get(@PathVariable UUID id) {
        return service.get(currentUser.require(), id);
    }

    @GetMapping("/{id}/history")
    public List<ApplicationDtos.StatusHistoryView> history(@PathVariable UUID id) {
        return service.history(currentUser.require(), id);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('COMPANY')")
    public ApplicationDtos.ApplicationView changeStatus(@PathVariable UUID id,
            @Valid @RequestBody ApplicationDtos.StatusChangeRequest request) {
        return service.changeStatus(currentUser.require(), id, request);
    }

    @PatchMapping("/{id}/withdraw")
    @PreAuthorize("hasRole('STUDENT')")
    public ApplicationDtos.ApplicationView withdraw(@PathVariable UUID id) {
        return service.withdraw(currentUser.require(), id);
    }
}
