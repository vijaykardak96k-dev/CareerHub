package com.careerhub.analytics;

import java.util.List;

public final class AnalyticsDtos {

    private AnalyticsDtos() { }

    public record CountPoint(String label, long value) { }

    public record AdminOverview(long totalStudents, long totalCompanies, long pendingCompanies,
                                long activeJobs, long activeInternships, long totalApplications,
                                long selectedStudents, long pendingCertificates) { }

    public record AnalyticsSummary(List<CountPoint> applicationsByStatus,
                                   List<CountPoint> jobsByMonth,
                                   List<CountPoint> topSkills,
                                   long selectedStudents,
                                   long totalApplications) { }
}
