# Epic 03 — Multi-Track Scheduling and Load Balancing

## Goal
Enable realistic daily planning with multiple concurrent tracks such as memorization, near review, far review, and catch-up days.

## Why this epic matters
The target product is not a single-track memorization simulator. It is a multi-track planning engine that must manage competing daily workloads without conflict.

## Scope

### Included
- multi-track plan composition
- track dependency rules
- track priority ordering
- balancing weights per track type
- catch-up day behavior
- off-day and holiday handling
- completion estimation
- review horizon constraints

### Excluded
- document export
- public API auth
- front-end scheduling UI

## Backend Tasks

### 1. Define plan and track configuration models
- [x] create plan definition entity
- [x] create track definition entity
- [x] define track type enum
- [x] define direction enum
- [x] define daily load weights

### 2. Build balancing service
- [x] calculate weighted load for each day
- [x] reduce review load automatically when memorization load rises
- [x] support configurable weights
- [x] keep balancing deterministic

### 3. Extend constraint system
- [x] review cannot overtake memorized progress
- [x] secondary review cannot exceed horizon
- [x] catch-up day suppresses memorization when configured
- [x] reverse direction constraints remain symmetric

### 4. Add working-day and catch-up support
- [x] support weekdays only plans
- [x] support custom holiday dates
- [x] support catch-up day expansion rules

### 5. Expand simulator tests
- [x] verify mixed-track schedules
- [x] verify review and memorization interaction
- [x] verify reverse-direction scheduling
- [x] verify off-day and catch-up behavior

## Acceptance Criteria
- Multi-track plans are valid and deterministic
- Daily workload stays within configured balance limits
- Track dependencies never generate invalid review progress
- Catch-up and off-day behavior works without manual intervention

## Deliverables
- balancing service
- track configuration model
- updated simulator behavior
- multi-track tests
