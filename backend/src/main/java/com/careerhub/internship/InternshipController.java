package com.careerhub.internship;

import com.careerhub.config.PageResponse;
import com.careerhub.job.WorkMode;
import com.careerhub.security.CurrentUser;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/internships")
@Tag(name = "Internships")
public class InternshipController {

    private final InternshipService internshipService;
    private final CurrentUser currentUser;

    public InternshipController(InternshipService internshipService, CurrentUser currentUser) {
        this.internshipService = internshipService;
        this.currentUser = currentUser;
    }

    @GetMapping("/public")
    public PageResponse<InternshipDtos.InternshipView> browsePublic(@RequestParam(required = false) String search,
                                                                    @RequestParam(required = false) String location,
                                                                    @RequestParam(required = false) WorkMode workMode,
                                                                    @RequestParam(defaultValue = "0") int page,
                                                                    @RequestParam(defaultValue = "10") int size) {
        return PageResponse.of(internshipService.browse(search, location, workMode,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))),
                InternshipDtos.InternshipView::summary);
    }

    @GetMapping("/public/{id}")
    public InternshipDtos.InternshipView publicDetail(@PathVariable UUID id) {
        return InternshipDtos.InternshipView.of(internshipService.requirePublished(id));
    }

    @GetMapping
    public PageResponse<InternshipDtos.InternshipView> browse(@RequestParam(required = false) String search,
                                                              @RequestParam(required = false) String location,
                                                              @RequestParam(required = false) WorkMode workMode,
                                                              @RequestParam(defaultValue = "0") int page,
                                                              @RequestParam(defaultValue = "10") int size) {
        return PageResponse.of(internshipService.browse(search, location, workMode,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))),
                InternshipDtos.InternshipView::summary);
    }

    @GetMapping("/{id}")
    public InternshipDtos.InternshipView detail(@PathVariable UUID id) {
        return InternshipDtos.InternshipView.of(internshipService.requireDetailed(id));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('COMPANY')")
    public PageResponse<InternshipDtos.InternshipView> mine(@RequestParam(defaultValue = "0") int page,
                                                            @RequestParam(defaultValue = "10") int size) {
        return PageResponse.of(internshipService.listForCompany(currentUser.require(),
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))),
                InternshipDtos.InternshipView::summary);
    }

    @PostMapping
    @PreAuthorize("hasRole('COMPANY')")
    public ResponseEntity<InternshipDtos.InternshipView> create(
            @Valid @RequestBody InternshipDtos.InternshipRequest request) {
        Internship internship = internshipService.create(currentUser.require(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(InternshipDtos.InternshipView.of(internship));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('COMPANY')")
    public InternshipDtos.InternshipView update(@PathVariable UUID id,
                                                @Valid @RequestBody InternshipDtos.InternshipRequest request) {
        return InternshipDtos.InternshipView.of(internshipService.update(currentUser.require(), id, request));
    }

    @PatchMapping("/{id}/close")
    @PreAuthorize("hasRole('COMPANY')")
    public InternshipDtos.InternshipView close(@PathVariable UUID id) {
        return InternshipDtos.InternshipView.of(internshipService.close(currentUser.require(), id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('COMPANY')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        internshipService.delete(currentUser.require(), id);
        return ResponseEntity.noContent().build();
    }
}
