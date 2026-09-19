package com.careerhub.application;

import java.util.List;

public enum ApplicationStatus {
    APPLIED,
    UNDER_REVIEW,
    SHORTLISTED,
    INTERVIEW,
    SELECTED,
    REJECTED,
    WITHDRAWN;

    /** Statuses a student is still "in the running" for. */
    public static List<ApplicationStatus> active() {
        return List.of(APPLIED, UNDER_REVIEW, SHORTLISTED, INTERVIEW);
    }

    public boolean isFinal() {
        return this == SELECTED || this == REJECTED || this == WITHDRAWN;
    }
}
