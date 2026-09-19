package com.careerhub.notification;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    Page<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    List<Notification> findTop5ByUserIdOrderByCreatedAtDesc(UUID userId);

    long countByUserIdAndReadFlagFalse(UUID userId);

    @Modifying(clearAutomatically = true)
    @Query("update Notification n set n.readFlag = true where n.user.id = :userId and n.readFlag = false")
    int markAllRead(UUID userId);
}
