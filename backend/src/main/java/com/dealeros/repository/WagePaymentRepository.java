package com.dealeros.repository;

import com.dealeros.model.WagePayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;

public interface WagePaymentRepository extends JpaRepository<WagePayment, Long> {
    List<WagePayment> findByStaffIdOrderByPaymentDateDesc(Long staffId);
    List<WagePayment> findAllByOrderByPaymentDateDesc();

    @Query("SELECT SUM(w.amount) FROM WagePayment w WHERE w.staffId = :staffId")
    BigDecimal totalPaidToStaff(Long staffId);
}
