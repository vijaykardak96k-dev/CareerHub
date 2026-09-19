package com.careerhub.job;

import com.careerhub.company.Company;
import com.careerhub.company.CompanyService;
import com.careerhub.exception.BadRequestException;
import com.careerhub.exception.ForbiddenException;
import com.careerhub.exception.NotFoundException;
import com.careerhub.skill.Skill;
import com.careerhub.skill.SkillRepository;
import com.careerhub.user.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@Transactional
public class JobService {

    private final JobRepository jobRepository;
    private final SkillRepository skillRepository;
    private final CompanyService companyService;

    public JobService(JobRepository jobRepository, SkillRepository skillRepository, CompanyService companyService) {
        this.jobRepository = jobRepository;
        this.skillRepository = skillRepository;
        this.companyService = companyService;
    }

    @Transactional(readOnly = true)
    public Page<Job> browse(String search, String location, WorkMode workMode,
                            EmploymentType employmentType, Pageable pageable) {
        return jobRepository.searchPublished(blankToNull(search), blankToNull(location),
                workMode, employmentType, pageable);
    }

    @Transactional(readOnly = true)
    public Job requireDetailed(UUID id) {
        return jobRepository.findDetailed(id).orElseThrow(() -> new NotFoundException("Job not found"));
    }

    @Transactional(readOnly = true)
    public Job requirePublished(UUID id) {
        Job job = requireDetailed(id);
        if (job.getStatus() != OpeningStatus.PUBLISHED) {
            throw new NotFoundException("Job not found");
        }
        return job;
    }

    @Transactional(readOnly = true)
    public Page<Job> listForCompany(User user, Pageable pageable) {
        Company company = companyService.requireByUser(user);
        return jobRepository.findByCompany(company.getId(), pageable);
    }

    public Job create(User user, JobDtos.JobRequest request) {
        Company company = companyService.requireApproved(user);
        Job job = new Job();
        job.setCompany(company);
        apply(job, request);
        return jobRepository.save(job);
    }

    public Job update(User user, UUID jobId, JobDtos.JobRequest request) {
        Job job = requireOwned(user, jobId);
        apply(job, request);
        return jobRepository.save(job);
    }

    public Job close(User user, UUID jobId) {
        Job job = requireOwned(user, jobId);
        job.setStatus(OpeningStatus.CLOSED);
        return jobRepository.save(job);
    }

    public void delete(User user, UUID jobId) {
        jobRepository.delete(requireOwned(user, jobId));
    }

    /** Business rule: a company may only modify its own openings. */
    public Job requireOwned(User user, UUID jobId) {
        Company company = companyService.requireByUser(user);
        Job job = requireDetailed(jobId);
        if (!job.getCompany().getId().equals(company.getId())) {
            throw new ForbiddenException("You can only manage your own job postings");
        }
        return job;
    }

    private void apply(Job job, JobDtos.JobRequest request) {
        if (request.salaryMin() != null && request.salaryMax() != null
                && request.salaryMin().compareTo(request.salaryMax()) > 0) {
            throw new BadRequestException("Minimum salary cannot be greater than maximum salary");
        }
        job.setTitle(request.title());
        job.setDescription(request.description());
        job.setLocation(request.location());
        job.setWorkMode(request.workMode());
        job.setEmploymentType(request.employmentType());
        job.setSalaryMin(request.salaryMin());
        job.setSalaryMax(request.salaryMax());
        job.setMinCgpa(request.minCgpa());
        job.setGraduationYear(request.graduationYear());
        job.setDeadline(request.deadline());
        job.setVacancies(request.vacancies());
        job.setStatus(request.status());
        job.setSkills(resolveSkills(request.skillIds()));
    }

    private Set<Skill> resolveSkills(Set<UUID> skillIds) {
        Set<Skill> skills = new LinkedHashSet<>();
        if (skillIds == null) {
            return skills;
        }
        for (UUID id : skillIds) {
            skills.add(skillRepository.findById(id)
                    .orElseThrow(() -> new BadRequestException("Unknown skill: " + id)));
        }
        return skills;
    }

    @Transactional(readOnly = true)
    public Page<Job> listForAdmin(OpeningStatus status, Pageable pageable) {
        return jobRepository.findAllForAdmin(status, pageable);
    }

    @Transactional(readOnly = true)
    public List<Job> recommended(List<UUID> skillIds, Pageable pageable) {
        if (skillIds == null || skillIds.isEmpty()) {
            return List.of();
        }
        return jobRepository.findRecommended(skillIds, pageable);
    }

    private String blankToNull(String value) {
        return (value == null || value.isBlank()) ? null : value;
    }
}
