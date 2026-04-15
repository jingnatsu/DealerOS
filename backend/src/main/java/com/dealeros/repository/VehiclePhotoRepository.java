package com.dealeros.repository;

import com.dealeros.model.VehiclePhoto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface VehiclePhotoRepository extends JpaRepository<VehiclePhoto, Long> {
    List<VehiclePhoto> findByStockIdOrderByOrderIndexAsc(String stockId);
    List<VehiclePhoto> findByStockIdAndFileCategory(String stockId, String fileCategory);
    Optional<VehiclePhoto> findByStockIdAndIsCoverTrue(String stockId);
    void deleteByStockId(String stockId);
}
