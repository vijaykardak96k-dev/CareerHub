package com.careerhub.job;

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

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/jobs")
@Tag(name = "Jobs")
public class JobController {

    private final JobService jobService;
    private final CurrentUser currentUser;

    public JobController(JobService jobService, CurrentUser currentUser) {
        this.jobService = jobService;
        this.currentUser = currentUser;
    }

    /** Public job board - no authentication required. */
    @GetMapping("/public")
    public PageResponse<JobDtos.JobView> browsePublic(@RequestParam(required = false) String search,
                                                      @RequestParam(required = false) String location,
                                                      @RequestParam(required = false) WorkMode workMode,
                                                      @RequestParam(required = false) EmploymentType employmentType,
                                                      @RequestParam(defaultValue = "0") int page,
                                                      @RequestParam(defaultValue = "10") int size) {
        return PageResponse.of(jobService.browse(search, location, workMode, employmentType,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))), JobDtos.JobView::summary);
    }

    @GetMapping("/public/{id}")
    public JobDtos.JobView publicDetail(@PathVariable UUID id) {
        return JobDtos.JobView.of(jobService.requirePublished(id));
    }

    /** Authenticated browse (same data, used by the student job board). */
    @GetMapping
    public PageResponse<JobDtos.JobView> browse(@RequestParam(required = false) String search,
                                                @RequestParam(required = false) String location,
                                                @RequestParam(required = false) WorkMode workMode,
                                                @RequestParam(required = false) EmploymentType employmentType,
                                                @RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "10") int size) {
        return PageResponse.of(jobService.browse(search, location, workMode, employmentType,
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))), JobDtos.JobView::summary);
    }

    @GetMapping("/{id}")
    public JobDtos.JobView detail(@PathVariable UUID id) {
        return JobDtos.JobView.of(jobService.requireDetailed(id));
    }

    @GetMapping("/mine")
    @PreAuthorize("hasRole('COMPANY')")
    public PageResponse<JobDtos.JobView> myJobs(@RequestParam(defaultValue = "0") int page,
                                                @RequestParam(defaultValue = "10") int size) {
        return PageResponse.of(jobService.listForCompany(currentUser.require(),
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"))), JobDtos.JobView::summary);
    }

    @PostMapping
    @PreAuthorize("hasRole('COMPANY')")
    public ResponseEntity<JobDtos.JobView> create(@Valid @RequestBody JobDtos.JobRequest request) {
        Job job = jobService.create(currentUser.require(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(JobDtos.JobView.of(job));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('COMPANY')")
    public JobDtos.JobView update(@PathVariable UUID id, @Valid @RequestBody JobDtos.JobRequest request) {
        return JobDtos.JobView.of(jobService.update(currentUser.require(), id, request));
    }

    @PatchMapping("/{id}/close")
    @PreAuthorize("hasRole('COMPANY')")
    public JobDtos.JobView close(@PathVariable UUID id) {
        return JobDtos.JobView.of(jobService.close(currentUser.require(), id));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('COMPANY')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        jobService.delete(currentUser.require(), id);
        return ResponseEntity.noContent().build();
    }
}
