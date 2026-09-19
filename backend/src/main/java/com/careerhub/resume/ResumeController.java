package com.careerhub.resume;

import com.careerhub.security.CurrentUser;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/resume")
@Tag(name = "Resume")
public class ResumeController {

    private final ResumeService service;
    private final CurrentUser currentUser;

    public ResumeController(ResumeService service, CurrentUser currentUser) {
        this.service = service;
        this.currentUser = currentUser;
    }

    @GetMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResumeDtos.ResumeView preview() {
        return service.build(currentUser.require());
    }

    @PutMapping
    @PreAuthorize("hasRole('STUDENT')")
    public ResumeDtos.ResumeView update(@Valid @RequestBody ResumeDtos.ResumeRequest request) {
        return service.update(currentUser.require(), request);
    }

    @GetMapping(value = "/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<byte[]> pdf() {
        byte[] pdf = service.generatePdf(currentUser.require());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"careerhub-resume.pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
