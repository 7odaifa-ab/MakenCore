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
- create plan definition entity
- create track definition entity
- define track type enum
- define direction enum
- define daily load weights

### 2. Build balancing service
- calculate weighted load for each day
- reduce review load automatically when memorization load rises
- support configurable weights
- keep balancing deterministic

### 3. Extend constraint system
- review cannot overtake memorized progress
- secondary review cannot exceed horizon
- catch-up day suppresses memorization when configured
- reverse direction constraints remain symmetric

### 4. Add working-day and catch-up support
- support weekdays only plans
- support custom holiday dates
- support catch-up day expansion rules

### 5. Expand simulator tests
- verify mixed-track schedules
- verify review and memorization interaction
- verify reverse-direction scheduling
- verify off-day and catch-up behavior

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
