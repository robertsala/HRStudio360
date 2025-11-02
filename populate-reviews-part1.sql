-- Create Review Cycles
INSERT INTO review_cycles (
  id, name, review_type, start_date, end_date, 
  self_assessment_deadline, manager_assessment_deadline, status,
  approval_threshold_amount, approval_threshold_percentage, created_at, updated_at
) VALUES
  ('aaaa0001-0001-0001-0001-000000000001'::uuid, 'Q4 2023 Performance Review', 'quarterly', '2023-10-01', '2023-12-31', '2024-01-10', '2024-01-15', 'completed', 5000, 10, '2023-10-01 08:00:00', '2024-01-18 17:00:00'),
  ('aaaa0002-0002-0002-0002-000000000002'::uuid, 'Q1 2024 Performance Review', 'quarterly', '2024-01-01', '2024-03-31', '2024-04-10', '2024-04-15', 'completed', 5000, 10, '2024-01-02 08:00:00', '2024-04-20 17:00:00'),
  ('aaaa0003-0003-0003-0003-000000000003'::uuid, 'Mid-Year 2024 Review', 'mid_year', '2024-01-01', '2024-06-30', '2024-07-10', '2024-07-15', 'completed', 7500, 12, '2024-01-02 08:00:00', '2024-07-20 17:00:00'),
  ('aaaa0004-0004-0004-0004-000000000004'::uuid, 'Annual 2024 Performance Review', 'annual', '2024-01-01', '2024-12-31', '2025-01-10', '2025-01-15', 'active', 10000, 15, '2024-01-02 08:00:00', now())
ON CONFLICT (id) DO NOTHING;

SELECT 'Review cycles created' as status;
