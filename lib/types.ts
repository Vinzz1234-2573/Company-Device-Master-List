export type UserRole = 'admin' | 'manager' | 'staff';
export type EmploymentStatus = 'active' | 'resigned' | 'inactive' | 'on_leave';
export type AcquisitionType = 'purchased' | 'donation_in_kind';
export type AssetStatus =
  | 'available'
  | 'assigned'
  | 'under_maintenance'
  | 'lost'
  | 'damaged'
  | 'retired'
  | 'disposed'
  | 'pending_verification';

export interface Department {
  id: string;
  code: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface Employee {
  id: string;
  employee_no: string | null;
  name: string;
  job_title: string | null;
  department_id: string | null;
  email: string | null;
  phone: string | null;
  employment_status: EmploymentStatus;
  joined_date: string | null;
  resigned_date: string | null;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  employee_id: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Asset {
  id: string;
  asset_code: string | null;
  asset_type: string;
  brand: string | null;
  model: string | null;
  description: string | null;
  serial_no: string | null;
  imei: string | null;
  sim_number: string | null;
  phone_number: string | null;
  status: AssetStatus;
  condition: string | null;
  location: string | null;
  department_id: string | null;
  remarks: string | null;
  needs_verification: boolean;
  verification_reason: string | null;
  acquisition_type: AcquisitionType;
  quantity: number;
  donor_name: string | null;
  donation_value: number | null;
  donation_received_date: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  updated_by: string | null;
}

export interface AssetTypeCatalogEntry {
  id: string;
  name: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface BrandCatalogEntry {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface AssetDocument {
  id: string;
  asset_id: string;
  file_name: string;
  storage_path: string;
  file_size: number | null;
  content_type: string | null;
  uploaded_by: string | null;
  created_at: string;
}

export interface AssetAssignment {
  id: string;
  asset_id: string;
  employee_id: string;
  department_id: string | null;
  issued_date: string | null;
  expected_return_date: string | null;
  returned_date: string | null;
  issued_by: string | null;
  returned_to: string | null;
  issue_condition: string | null;
  return_condition: string | null;
  remarks: string | null;
  needs_verification: boolean;
  verification_reason: string | null;
  created_at: string;
  created_by: string | null;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  user_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  created_at: string;
}

type TableDef<Row, Insert, Update = Partial<Insert>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  public: {
    Tables: {
      departments: TableDef<Department, Partial<Department> & { code: string; name: string }>;
      employees: TableDef<Employee, Partial<Employee> & { name: string }>;
      profiles: TableDef<Profile, Partial<Profile> & { id: string; email: string }>;
      assets: TableDef<Asset, Partial<Asset> & { asset_type: string }>;
      asset_assignments: TableDef<AssetAssignment, Partial<AssetAssignment> & { asset_id: string; employee_id: string }>;
      asset_documents: TableDef<AssetDocument, Partial<AssetDocument> & { asset_id: string; file_name: string; storage_path: string }>;
      audit_logs: TableDef<AuditLog, Partial<AuditLog> & { action: string; entity_type: string }>;
    };
    Views: Record<string, never>;
    Functions: {
      assign_asset: {
        Args: {
          p_asset_id: string;
          p_employee_id: string;
          p_issued_date: string | null;
          p_expected_return_date: string | null;
          p_issued_by: string | null;
          p_issue_condition: string | null;
          p_remarks: string | null;
        };
        Returns: string;
      };
      return_asset: {
        Args: {
          p_assignment_id: string;
          p_returned_date: string | null;
          p_returned_to: string | null;
          p_return_condition: string | null;
          p_remarks: string | null;
          p_new_status: AssetStatus;
        };
        Returns: undefined;
      };
      change_asset_status: {
        Args: { p_asset_id: string; p_new_status: AssetStatus; p_remarks: string | null };
        Returns: undefined;
      };
      set_user_role: {
        Args: { p_user_id: string; p_role: UserRole };
        Returns: undefined;
      };
    };
    Enums: {
      user_role: UserRole;
      employment_status: EmploymentStatus;
      asset_status: AssetStatus;
      acquisition_type: AcquisitionType;
    };
  };
}

export interface EmployeeWithDept extends Employee {
  department: Department | null;
}

export interface AssetWithDept extends Asset {
  department: Department | null;
}

export interface AssignmentWithRelations extends AssetAssignment {
  employee: Employee | null;
  department: Department | null;
  asset?: Asset | null;
}
