package com.dealeros.repository;

import com.dealeros.model.CollectionEntry;
import com.dealeros.model.CollectionType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CollectionEntryRepository extends JpaRepository<CollectionEntry, Long> {

    List<CollectionEntry> findByTypeOrderByScheduledDateAsc(CollectionType type);
    List<CollectionEntry> findByStatusOrderByScheduledDateAsc(String status);
    List<CollectionEntry> findByPlateIgnoreCase(String plate);
    List<CollectionEntry> findAllByOrderByScheduledDateDesc();
}
