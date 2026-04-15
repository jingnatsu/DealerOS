package com.dealeros.repository;

import com.dealeros.model.ServiceRecord;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ServiceRecordRepository extends JpaRepository<ServiceRecord, Long> {
    List<ServiceRecord> findByStockIdOrderByServiceDateDesc(String stockId);
    List<ServiceRecord> findByPlateIgnoreCaseOrderByServiceDateDesc(String plate);
    List<ServiceRecord> findAllByOrderByServiceDateDesc();
}
