package com.dealeros.repository;

import com.dealeros.model.SoldVehicle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface SoldVehicleRepository extends JpaRepository<SoldVehicle, Long> {

    Optional<SoldVehicle> findByStockId(String stockId);
    Optional<SoldVehicle> findByPlateIgnoreCase(String plate);

    List<SoldVehicle> findByInvestorOrderByDateSoldDesc(String investor);

    @Query("SELECT s FROM SoldVehicle s WHERE s.dateSold BETWEEN :from AND :to ORDER BY s.dateSold DESC")
    List<SoldVehicle> findByDateSoldBetween(LocalDate from, LocalDate to);

    @Query("SELECT FUNCTION('FORMATDATETIME', s.dateSold, 'yyyy-MM') as month, " +
           "COUNT(s), SUM(s.grossProfit) FROM SoldVehicle s GROUP BY month ORDER BY month DESC")
    List<Object[]> monthlySummary();

    List<SoldVehicle> findAllByOrderByDateSoldDesc();
}
