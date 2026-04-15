package com.dealeros.repository;

import com.dealeros.model.Viewing;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ViewingRepository extends JpaRepository<Viewing, Long> {
    List<Viewing> findByStatusOrderByViewingDateAscViewingTimeAsc(String status);
    List<Viewing> findByViewingDateOrderByViewingTimeAsc(LocalDate date);
    List<Viewing> findByStockId(String stockId);
    List<Viewing> findAllByOrderByViewingDateDescViewingTimeDesc();
}
