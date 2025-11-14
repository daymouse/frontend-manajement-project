import { useState, useEffect } from "react";
import { apiFetch } from "../../../Server";
import { utils as XLSXUtils, writeFile } from 'xlsx';
import jsPDF from 'jspdf';

export const useProjectDetailHandler = (projectId) => {
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [summary, setSummary] = useState({});
  const [members, setMembers] = useState([]);
  const [active, setActive] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);

  /**
   * Fetch detail project
   */
  const fetchProjectDetail = async () => {
    try {
      setLoading(true);

      const res = await apiFetch(`/detail-projects/${projectId}/detail`, { method: "GET" });
      if (!res.success) throw new Error(res.error || "Gagal memuat detail project");

      const {
        project_id,
        project_name,
        description,
        deadline,
        status,
        project_members,
        total_cards,
        cards_by_status,
        done_subtasks,
        subtask_time_logs,
      } = res;

      setProject({
        project_id,
        project_name,
        description,
        status,
        deadline,
      });

      setSummary({
        total_cards,
        ...cards_by_status,
      });

      setMembers(project_members || []);

      setActive({
        cards: [],
        subtasks: done_subtasks || [],
        time_logs: subtask_time_logs || [],
      });
    } catch (err) {
      console.error("❌ Error fetchProjectDetail:", err);
      setError(err.message || "Terjadi kesalahan saat memuat detail project.");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const res = await apiFetch("/users/member", "GET");
      if (res.data) setUsers(res.data);
    } catch (err) {
      console.error("❌ Gagal fetch users:", err);
    }
  };

  // 🔹 Tambah member
  const addMember = async (user_id) => {
    try {
      const res = await apiFetch(`/project/${projectId}/add`, {
        method: "POST",
        body: JSON.stringify({ user_id }),
      });
      if (res.success) fetchProjectDetail();
    } catch (err) {
      console.error("❌ Gagal tambah member:", err);
    }
  };

  // 🔹 Hapus member
  const removeMember = async (userId) => {
    try {
      const res = await apiFetch(`/project/${projectId}/remove/${userId}`, {
        method: "DELETE",
      });

      if (!res.success) throw new Error(res.error || "Gagal menghapus anggota");

      await fetchProjectDetail();
      return res;
    } catch (err) {
      console.error("❌ Error removeMember:", err);
      setError(err.message || "Terjadi kesalahan saat menghapus anggota.");
      throw err;
    }
  };

  /**
   * Update project inline
   */
  const updateProjectInline = async (data) => {
    try {
      const res = await apiFetch(`/detail-projects/${projectId}/detail`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });

      if (!res.success) throw new Error(res.error || "Gagal mengupdate project");

      await fetchProjectDetail();
      return res;
    } catch (err) {
      console.error("❌ Error updateProjectInline:", err);
      setError(err.message || "Terjadi kesalahan saat mengupdate project.");
      throw err;
    }
  };

  const updateMemberRole = async (memberId, role) => {
    try {
      const res = await apiFetch(`/detail-projects/${projectId}/members/${memberId}`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });

      if (!res.success) throw new Error(res.error || "Gagal mengupdate role anggota");

      await fetchProjectDetail();
      return res;
    } catch (err) {
      console.error("❌ Error updateMemberRole:", err);
      setError(err.message || "Terjadi kesalahan saat mengupdate role anggota.");
      throw err;
    }
  };

  /**
   * Generate report
   */
  const generateProjectReport = async (startDate, endDate) => {
    try {
      const query = new URLSearchParams({
        ...(startDate && { start_date: startDate }),
        ...(endDate && { end_date: endDate }),
      });

      const res = await apiFetch(`/detail-projects/${projectId}/report?${query}`, {
        method: "GET",
      });

      console.log("📊 API Response:", res);

      if (!res.success) throw new Error(res.error || "Gagal generate laporan project");

      const reportData = res.data || res;
      setReport(reportData);

      return reportData;
    } catch (err) {
      console.error("❌ Error generateProjectReport:", err);
      setError(err.message || "Terjadi kesalahan saat generate laporan project.");
      throw err;
    }
  };

  /**
   * Export report ke Excel
   */
  const exportToExcel = async (reportData = report) => {
    try {
      if (!reportData) {
        throw new Error("Tidak ada data report untuk di-export");
      }

      // Create workbook
      const wb = XLSXUtils.book_new();

      // Sheet 1: Summary
      const summaryData = [
        ["LAPORAN PROYEK", ""],
        ["Nama Proyek", reportData.project_name],
        ["Status", reportData.project_status],
        ["Total Kartu", reportData.total_cards],
        ["Kartu Selesai", reportData.cards_done],
        ["Kartu Dalam Proses", reportData.cards_in_progress],
        ["Total Jam", reportData.total_hours],
        ["Total Anggota", reportData.total_members],
        ["Periode", `${reportData.date_range?.start_date} s/d ${reportData.date_range?.end_date}`],
        [""], [""]
      ];

      const wsSummary = XLSXUtils.aoa_to_sheet(summaryData);
      XLSXUtils.book_append_sheet(wb, wsSummary, "Ringkasan");

      // Sheet 2: Aktivitas Anggota
      const membersData = [
        ["AKTIVITAS ANGGOTA"],
        ["Nama", "Total Jam", "Total Kartu", "Total Subtask"]
      ];

      if (reportData.members_activity?.length > 0) {
        reportData.members_activity.forEach(member => {
          membersData.push([
            member.user_name,
            member.total_hours,
            member.total_cards,
            member.total_subtasks
          ]);
        });
      }

      const wsMembers = XLSXUtils.aoa_to_sheet(membersData);
      XLSXUtils.book_append_sheet(wb, wsMembers, "Aktivitas Anggota");

      // Sheet 3: Detail Kartu
      const cardsData = [
        ["DETAIL KARTU"],
        ["Judul Kartu", "Status", "Prioritas", "Board", "Tanggal Jatuh Tempo", "Dibuat Oleh"]
      ];

      if (reportData.report_details?.length > 0) {
        reportData.report_details.forEach(card => {
          cardsData.push([
            card.card_title,
            card.status,
            card.priority,
            card.board_name,
            card.due_date ? new Date(card.due_date).toLocaleDateString('id-ID') : '-',
            card.created_by
          ]);
        });
      }

      const wsCards = XLSXUtils.aoa_to_sheet(cardsData);
      XLSXUtils.book_append_sheet(wb, wsCards, "Detail Kartu");

      // Export file
      const fileName = `Laporan_${reportData.project_name}_${new Date().toISOString().split('T')[0]}.xlsx`;
      writeFile(wb, fileName);
      
      return { success: true, message: "Berhasil export ke Excel" };
    } catch (err) {
      console.error("❌ Error exportToExcel:", err);
      throw new Error(err.message || "Gagal export ke Excel");
    }
  };

  /**
   * Export report ke PDF
   */
 const exportToPDF = async (reportData = report) => {
    try {
      if (!reportData) {
        throw new Error("Tidak ada data report untuk di-export");
      }

      // Create PDF document
      const pdf = new jsPDF();
      let yPosition = 20;

      // Header
      pdf.setFontSize(20);
      pdf.setTextColor(40, 40, 40);
      pdf.text("LAPORAN PROYEK", 105, yPosition, { align: "center" });
      yPosition += 15;

      // Project Info
      pdf.setFontSize(12);
      pdf.setTextColor(80, 80, 80);
      pdf.text(`Nama Proyek: ${reportData.project_name}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Status: ${reportData.project_status}`, 20, yPosition);
      yPosition += 8;
      pdf.text(`Periode: ${reportData.date_range?.start_date} s/d ${reportData.date_range?.end_date}`, 20, yPosition);
      yPosition += 15;

      // Summary Section
      pdf.setFontSize(14);
      pdf.setTextColor(40, 40, 40);
      pdf.text("RINGKASAN", 20, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      const summaryData = [
        `Total Kartu: ${reportData.total_cards}`,
        `Kartu Selesai: ${reportData.cards_done}`,
        `Kartu Dalam Proses: ${reportData.cards_in_progress}`,
        `Total Jam: ${reportData.total_hours} jam`,
        `Total Anggota: ${reportData.total_members}`
      ];

      summaryData.forEach(line => {
        pdf.text(line, 25, yPosition);
        yPosition += 6;
      });

      yPosition += 10;

      // Members Activity Section (DIPERBAIKI)
      const memberActivityMap = new Map();
      
      if (reportData.report_details?.length > 0) {
        reportData.report_details.forEach(card => {
          card.assigned_users?.forEach(user => {
            const userId = user.user_id;
            if (!memberActivityMap.has(userId)) {
              memberActivityMap.set(userId, {
                user_name: user.user_name,
                total_hours: '0.00',
                total_cards: 0,
                total_subtasks: 0
              });
            }
            const member = memberActivityMap.get(userId);
            member.total_cards += 1;
          });

          card.subtasks?.forEach(subtask => {
            const assignedTo = subtask.assigned_to;
            const user = card.assigned_users?.find(u => u.user_name === assignedTo);
            if (user) {
              const userId = user.user_id;
              if (!memberActivityMap.has(userId)) {
                memberActivityMap.set(userId, {
                  user_name: assignedTo,
                  total_hours: '0.00',
                  total_cards: 0,
                  total_subtasks: 0
                });
              }
              const member = memberActivityMap.get(userId);
              member.total_subtasks += 1;
              
              if (subtask.actual_hours && subtask.actual_hours !== '0.00') {
                member.total_hours = (parseFloat(member.total_hours) + parseFloat(subtask.actual_hours)).toFixed(2);
              }
            }
          });
        });
      }

      if (memberActivityMap.size > 0) {
        pdf.setFontSize(14);
        pdf.text("AKTIVITAS ANGGOTA", 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(10);
        let memberIndex = 1;
        memberActivityMap.forEach((member, userId) => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }
          
          pdf.text(`${memberIndex}. ${member.user_name}`, 25, yPosition);
          yPosition += 5;
          pdf.text(`   - Total Jam: ${member.total_hours} jam`, 30, yPosition);
          yPosition += 5;
          pdf.text(`   - Total Kartu: ${member.total_cards}`, 30, yPosition);
          yPosition += 5;
          pdf.text(`   - Total Subtask: ${member.total_subtasks}`, 30, yPosition);
          yPosition += 8;
          memberIndex++;
        });
      }

      yPosition += 5;

      // Detail Kartu Section (DIPERBAIKI)
      if (reportData.report_details?.length > 0) {
        if (yPosition > 250) {
          pdf.addPage();
          yPosition = 20;
        }

        pdf.setFontSize(14);
        pdf.text("DETAIL KARTU", 20, yPosition);
        yPosition += 10;

        pdf.setFontSize(8); // Ukuran font lebih kecil untuk muat lebih banyak data
        reportData.report_details.forEach((card, index) => {
          if (yPosition > 270) {
            pdf.addPage();
            yPosition = 20;
          }

          const assignedTo = card.assigned_users?.map(user => user.user_name).join(', ') || '-';
          
          pdf.text(`${index + 1}. ${card.card_title}`, 25, yPosition);
          yPosition += 4;
          pdf.text(`   Status: ${card.status} | Prioritas: ${card.priority}`, 30, yPosition);
          yPosition += 4;
          pdf.text(`   Jatuh Tempo: ${card.due_date ? new Date(card.due_date).toLocaleDateString('id-ID') : '-'}`, 30, yPosition);
          yPosition += 4;
          pdf.text(`   Ditugaskan ke: ${assignedTo}`, 30, yPosition);
          yPosition += 6;

          // Tampilkan subtask jika ada
          if (card.subtasks?.length > 0) {
            pdf.text(`   Subtask:`, 30, yPosition);
            yPosition += 4;
            
            card.subtasks.forEach((subtask, subIndex) => {
              if (yPosition > 270) {
                pdf.addPage();
                yPosition = 20;
              }
              
              pdf.text(`     ${subIndex + 1}. ${subtask.subtask_title}`, 35, yPosition);
              yPosition += 4;
              pdf.text(`       - Ditugaskan: ${subtask.assigned_to}`, 40, yPosition);
              yPosition += 4;
              pdf.text(`       - Status: ${subtask.status} | Review: ${subtask.review_status}`, 40, yPosition);
              yPosition += 4;
              pdf.text(`       - Actual Hours: ${subtask.actual_hours}`, 40, yPosition);
              yPosition += 4;
            });
            yPosition += 2;
          }
          
          yPosition += 4;
        });
      }

      // Save PDF
      const fileName = `Laporan_${reportData.project_name}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

      return { success: true, message: "Berhasil export ke PDF" };
    } catch (err) {
      console.error("❌ Error exportToPDF:", err);
      throw new Error(err.message || "Gagal export ke PDF");
    }
  };

  /**
   * Request review project
   */
  const requestProjectReview = async (requestedBy) => {
    try {
      const res = await apiFetch(`/detail-projects/${projectId}/request-review`, {
        method: "POST",
        body: JSON.stringify({ requested_by: requestedBy }),
      });

      if (!res.success) throw new Error(res.error || "Gagal request review project");

      return res;
    } catch (err) {
      console.error("❌ Error requestProjectReview:", err);
      setError(err.message || "Terjadi kesalahan saat request review project.");
      throw err;
    }
  };

  /**
   * Review project (approve/reject)
   */
  const reviewProject = async (reviewerId, status, note) => {
    try {
      const res = await apiFetch(`/detail-projects/${projectId}/review`, {
        method: "POST",
        body: JSON.stringify({ reviewer_id: reviewerId, status, note }),
      });

      if (!res.success) throw new Error(res.error || "Gagal melakukan review project");

      return res;
    } catch (err) {
      console.error("❌ Error reviewProject:", err);
      setError(err.message || "Terjadi kesalahan saat melakukan review project.");
      throw err;
    }
  };

  // 🔹 Tambah anggota project
  const addProjectMember = async (userId, role) => {
    try {
      const res = await apiFetch(`/detail-projects/${projectId}/members`, {
        method: "POST",
        body: JSON.stringify({ user_id: userId, role }),
      });

      if (!res.success) throw new Error(res.error || "Gagal menambahkan anggota");

      await fetchProjectDetail();
      return res;
    } catch (err) {
      console.error("❌ Error addProjectMember:", err);
      setError(err.message || "Terjadi kesalahan saat menambahkan anggota.");
      throw err;
    }
  };

  /**
   * Clear report data
   */
  const clearReport = () => {
    setReport(null);
  };

  /**
   * Saat mount, ambil semua data utama
   */
  useEffect(() => {
    if (!projectId) return;
    fetchProjectDetail();
  }, [projectId]);

  return {
    loading,
    error,
    project,
    summary,
    members,
    active,
    report,
    users,
    refresh: fetchProjectDetail,
    updateProjectInline,
    addProjectMember,
    updateMemberRole,
    generateProjectReport,
    exportToExcel,
    exportToPDF,
    requestProjectReview,
    reviewProject,
    fetchAllUsers,
    removeMember,
    addMember,
    clearReport,
  };
};