package com.dealeros.repository;

import com.dealeros.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByStatusOrderByCreatedAtDesc(String status);
    List<Task> findByStockId(String stockId);
    List<Task> findAllByOrderByCreatedAtDesc();
}
