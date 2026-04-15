package com.dealeros.controller;

import com.dealeros.model.Task;
import com.dealeros.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskRepository repo;

    @GetMapping
    public List<Task> getAll() {
        return repo.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/open")
    public List<Task> getOpen() {
        return repo.findByStatusOrderByCreatedAtDesc("Pending");
    }

    @PostMapping
    public ResponseEntity<Task> create(@RequestBody Task task) {
        if (task.getStatus() == null) task.setStatus("Pending");
        if (task.getPriority() == null) task.setPriority("Normal");
        return ResponseEntity.status(HttpStatus.CREATED).body(repo.save(task));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id,
                                          @RequestBody Map<String, String> body) {
        return repo.findById(id).map(t -> {
            t.setStatus(body.get("status"));
            return ResponseEntity.ok(repo.save(t));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
