
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { api } from '../api/client';

type Employee = {
  MaNV: number;
  HoTen: string;
  ChucVu: string | null;
};

type Rental = {
  MaDT: number;
  MaNV: number | null;
  TrangThai: string;
};

type EmployeesResponse = {
  success: boolean;
  data: Employee[];
};

type RentalResponse = {
  success: boolean;
  data: {
    order: Rental;
  };
};

export default function RentalAssignment() {
  const router = useRouter();

  const maDT =
    typeof router.query.id === 'string'
      ? Number(router.query.id)
      : NaN;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [order, setOrder] = useState<Rental | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = useCallback(async () => {
    if (!Number.isSafeInteger(maDT) || maDT <= 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const [employeeResponse, rentalResponse] =
        await Promise.all([
          api<EmployeesResponse>('/rentals/employees'),
          api<RentalResponse>(`/rentals/${maDT}`),
        ]);

      setEmployees(employeeResponse.data || []);

      const currentOrder = rentalResponse.data.order;

      setOrder(currentOrder);

      setSelectedEmployee(
        currentOrder.MaNV
          ? String(currentOrder.MaNV)
          : '',
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể tải thông tin phân công',
      );
    } finally {
      setLoading(false);
    }
  }, [maDT]);

  useEffect(() => {
    if (router.isReady) {
      void loadData();
    }
  }, [router.isReady, loadData]);

  async function assignEmployee() {
    if (!order || !selectedEmployee || saving) {
      return;
    }

    const selected = employees.find(
      (item) => item.MaNV === Number(selectedEmployee),
    );

    if (!selected) {
      setError('Vui lòng chọn nhân viên hợp lệ.');
      return;
    }

    const confirmed = window.confirm(
      `Phân công đơn thuê #${maDT} cho ${selected.HoTen}?`,
    );

    if (!confirmed) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api(`/rentals/${maDT}/assign`, {
        method: 'PATCH',
        body: JSON.stringify({
          maNV: selected.MaNV,
        }),
      });

      setSuccess(
        `Đã phân công đơn thuê #${maDT} cho ${selected.HoTen}.`,
      );

      await loadData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể phân công nhân viên',
      );
    } finally {
      setSaving(false);
    }
  }

  const finished =
    order?.TrangThai === 'Đã trả' ||
    order?.TrangThai === 'Đã hủy';

  return (
    <section className="rounded-2xl border border-[#dce7d8] bg-white p-6 text-[#294530]">
      <h2 className="text-xl font-bold text-[#315b3d]">
        Phân công nhân viên xử lý
      </h2>

      <p className="mt-2 text-sm text-gray-500">
        Nhân viên được phân công sẽ tiếp nhận và xử lý đơn thuê.
      </p>

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      {success && (
        <p className="mt-4 rounded-xl bg-green-50 p-4 text-green-800">
          {success}
        </p>
      )}

      {loading ? (
        <p className="mt-5 text-gray-500">
          Đang tải thông tin...
        </p>
      ) : (
        <>
          <div className="mt-5">
            <label
              htmlFor="rental-employee"
              className="mb-2 block text-sm font-semibold"
            >
              Nhân viên phụ trách
            </label>

            <select
              id="rental-employee"
              value={selectedEmployee}
              onChange={(event) =>
                setSelectedEmployee(event.target.value)
              }
              disabled={finished || saving}
              className="w-full rounded-xl border border-[#d4e1d0] bg-white px-4 py-3"
            >
              <option value="">
                Chọn nhân viên xử lý
              </option>

              {employees.map((employee) => (
                <option
                  key={employee.MaNV}
                  value={employee.MaNV}
                >
                  {employee.HoTen}
                  
                </option>
              ))}
            </select>
          </div>

          {order?.MaNV && (
            <p className="mt-3 text-sm text-[#315b3d]">
              Mã nhân viên đang phụ trách: #{order.MaNV}
            </p>
          )}

          {finished ? (
            <p className="mt-5 text-sm text-gray-500">
              Đơn thuê đã kết thúc, không thể thay đổi phân công.
            </p>
          ) : (
            <button
              type="button"
              onClick={() => void assignEmployee()}
              disabled={
                saving ||
                !selectedEmployee ||
                !order ||
                Number(selectedEmployee) === Number(order.MaNV)
              }
              className="mt-5 rounded-xl bg-[#315b3d] px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? 'Đang lưu...'
                : 'Xác nhận phân công'}
            </button>
          )}
        </>
      )}
    </section>
  );
}
