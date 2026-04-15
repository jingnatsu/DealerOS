package com.dealeros.repository;

import com.dealeros.model.FinanceEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface FinanceEntryRepository extends JpaRepository<FinanceEntry, Long> {

    List<FinanceEntry> findByStockIdOrderByDateDesc(String stockId);
    List<FinanceEntry> findByPlateIgnoreCaseOrderByDateDesc(String plate);
    List<FinanceEntry> findByCategoryOrderByDateDesc(String category);
    List<FinanceEntry> findAllByOrderByDateDesc();

    @Query("SELECT SUM(f.amount) FROM FinanceEntry f WHERE f.stockId = :stockId")
    BigDecimal sumByStockId(String stockId);

    @Query("SELECT SUM(f.amount) FROM FinanceEntry f WHERE f.date BETWEEN :from AND :to")
    BigDecimal sumByDateRange(LocalDate from, LocalDate to);

    /** Overhead entries (not linked to a vehicle) */
    @Query("SELECT f FROM FinanceEntry f WHERE f.stockId IS NULL OR f.stockId = '' ORDER BY f.date DESC")
    List<FinanceEntry> findOverheads();
}
