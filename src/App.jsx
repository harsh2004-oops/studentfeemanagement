import React, { useState, useEffect, useMemo } from 'react';
import { Users, UserPlus, DollarSign, Calendar, Search, Filter, Edit, Clock, Send, AlertCircle, IndianRupee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const FeeManagerModal = ({ student, onClose, onUpdate }) => {
  const [monthlyStatus, setMonthlyStatus] = useState(student.feesPaid || Array(12).fill(false));

  const handleCheckboxChange = (index) => {
    const newStatus = [...monthlyStatus];
    newStatus[index] = !newStatus[index];
    setMonthlyStatus(newStatus);
  };

  const handlePayForAllYear = () => {
    setMonthlyStatus(Array(12).fill(true));
  };

  const handleSaveChanges = () => {
    onUpdate(student.id, monthlyStatus);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Manage Fees</h2>
        <p className="text-gray-600 mb-6">For: <span className="font-semibold">{student.name}</span></p>
        
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mb-6">
          {MONTHS.map((month, index) => (
            <label key={month} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
              <input
                type="checkbox"
                checked={monthlyStatus[index]}
                onChange={() => handleCheckboxChange(index)}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-gray-700 font-medium">{month}</span>
            </label>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <button
            onClick={handlePayForAllYear}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-semibold"
          >
            Pay for Year
          </button>
          <button
            onClick={handleSaveChanges}
            className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 font-semibold"
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

const App = () => {
  const [students, setStudents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [managingStudentId, setManagingStudentId] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(-1);
  const [formData, setFormData] = useState({
    name: '',
    standard: '',
    schoolName: '',
    phoneNumber: '',
    monthlyFees: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const savedStudents = localStorage.getItem('students');
        if (savedStudents) {
          const parsedStudents = JSON.parse(savedStudents);
          const migratedStudents = parsedStudents.map(student => {
            if (typeof student.feesPaid === 'boolean' || !Array.isArray(student.feesPaid)) {
              return { ...student, feesPaid: Array(12).fill(student.feesPaid || false) };
            }
            return student;
          });
          setStudents(migratedStudents);
        }
      } catch (error) {
        console.error("Error parsing or migrating students from localStorage", error);
      }
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('students', JSON.stringify(students));
    }
  }, [students, loading]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.name && formData.standard && formData.schoolName && formData.phoneNumber && formData.monthlyFees) {
      const newStudent = {
        id: Date.now(),
        ...formData,
        createdAt: new Date().toISOString(),
        feesPaid: Array(12).fill(false),
      };
      setStudents(prev => [...prev, newStudent]);
      setFormData({ name: '', standard: '', schoolName: '', phoneNumber: '', monthlyFees: '' });
      setShowForm(false);
    }
  };

  const handleUpdateFees = (studentId, newFeesPaid) => {
    setStudents(prev => prev.map(student =>
      student.id === studentId ? { ...student, feesPaid: newFeesPaid } : student
    ));
  };

  const formatPhoneNumber = (phone) => {
    return phone.replace(/\D/g, '');
  }

  const getFeeStatus = (student, monthIndex) => {
    const feesPaid = student.feesPaid || [];
    if (monthIndex > -1) {
        const paid = feesPaid[monthIndex];
        return { text: paid ? 'Paid' : 'Unpaid', color: paid ? 'green' : 'red' };
    }
    const paidCount = feesPaid.filter(p => p).length;
    if (paidCount === 12) return { text: 'Fully Paid', color: 'green', count: paidCount };
    if (paidCount === 0) return { text: 'Unpaid', color: 'red', count: paidCount };
    return { text: 'Partially Paid', color: 'yellow', count: paidCount };
  };

  const fullyPaidCount = useMemo(() => students.filter(s => s.feesPaid && s.feesPaid.every(p => p)).length, [students]);
  const pendingCount = useMemo(() => students.length - fullyPaidCount, [students, fullyPaidCount]);

  const filteredStudents = useMemo(() => students.filter(student => {
    const nameMatch = student.name && student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const schoolMatch = student.schoolName && student.schoolName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = nameMatch || schoolMatch;

    if (!matchesSearch) return false;

    const feesPaid = student.feesPaid || [];
    if (selectedMonth > -1) {
        const monthPaid = feesPaid[selectedMonth];
        if (filterStatus === 'paid') return monthPaid;
        if (filterStatus === 'unpaid') return !monthPaid;
    } else {
        const isFullyPaid = feesPaid.every(p => p);
        if (filterStatus === 'paid') return isFullyPaid;
        if (filterStatus === 'unpaid') return !isFullyPaid;
    }

    return true;
  }), [students, searchTerm, selectedMonth, filterStatus]);

  const monthlyStats = useMemo(() => {
    if (selectedMonth === -1) return null;

    const remainingStudents = students.filter(s => s.feesPaid && !s.feesPaid[selectedMonth]);
    const remainingCount = remainingStudents.length;
    const remainingAmount = remainingStudents.reduce((sum, s) => sum + parseFloat(s.monthlyFees || 0), 0);

    return { remainingCount, remainingAmount };
  }, [students, selectedMonth]);

  const managingStudent = students.find(s => s.id === managingStudentId);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Student Fee Manager...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20">
      <header className="bg-white shadow-lg border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 rounded-xl">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Student Fee Manager</h1>
                <p className="text-gray-600 text-sm">Manage student details and fees</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowForm(true)}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center space-x-2 text-sm"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Student</span>
            </motion.button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-600">Total Students</p>
                        <p className="text-xl font-bold text-gray-900">{students.length}</p>
                    </div>
                    <div className="bg-blue-100 p-2 rounded-full"><Users className="h-5 w-5 text-blue-600" /></div>
                </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-600">Fully Paid</p>
                        <p className="text-xl font-bold text-green-600">{fullyPaidCount}</p>
                    </div>
                    <div className="bg-green-100 p-2 rounded-full"><DollarSign className="h-5 w-5 text-green-600" /></div>
                </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-600">Pending Fees</p>
                        <p className="text-xl font-bold text-red-600">{pendingCount}</p>
                    </div>
                    <div className="bg-red-100 p-2 rounded-full"><Calendar className="h-5 w-5 text-red-600" /></div>
                </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-600">Filter by Month</p>
                        <select value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
                            <option value={-1}>Overall Status</option>
                            {MONTHS.map((month, index) => (
                                <option key={index} value={index}>{month}</option>
                            ))}
                        </select>
                    </div>
                    <div className="bg-purple-100 p-2 rounded-full"><Clock className="h-5 w-5 text-purple-600" /></div>
                </div>
            </motion.div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input type="text" placeholder="Search by name or school..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm">
                <option value="all">All</option>
                <option value="paid">{selectedMonth > -1 ? 'Paid for Month' : 'Fully Paid'}</option>
                <option value="unpaid">{selectedMonth > -1 ? 'Unpaid for Month' : 'Pending'}</option>
              </select>
            </div>
          </div>
        </div>

        <AnimatePresence>
        {selectedMonth > -1 && monthlyStats && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white rounded-xl shadow-md p-4 mb-6 border border-gray-100 flex items-center gap-6">
                <div className="flex items-center gap-3">
                    <div className="bg-red-100 p-2 rounded-full"><AlertCircle className="h-6 w-6 text-red-600" /></div>
                    <div>
                        <p className="text-xs font-medium text-gray-600">Students with Pending Fees for {MONTHS[selectedMonth]}</p>
                        <p className="text-xl font-bold text-red-600">{monthlyStats.remainingCount}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="bg-orange-100 p-2 rounded-full"><IndianRupee className="h-6 w-6 text-orange-600" /></div>
                    <div>
                        <p className="text-xs font-medium text-gray-600">Total Amount Pending for {MONTHS[selectedMonth]}</p>
                        <p className="text-xl font-bold text-orange-600">₹{monthlyStats.remainingAmount.toLocaleString('en-IN')}</p>
                    </div>
                </div>
            </motion.div>
        )}
        </AnimatePresence>

        <div className="space-y-3">
          <AnimatePresence>
            {filteredStudents.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-xl shadow-md p-8 text-center border border-gray-100">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900 mb-1">No students found</h3>
                <p className="text-gray-600 text-sm">Your current filters may be too restrictive.</p>
              </motion.div>
            ) : (
              filteredStudents.map((student, index) => {
                const feeStatus = getFeeStatus(student, selectedMonth);
                const statusColorClasses = {
                  green: 'bg-green-100 text-green-800',
                  red: 'bg-red-100 text-red-800',
                  yellow: 'bg-yellow-100 text-yellow-800',
                };
                const showReminder = feeStatus.color === 'red' || (selectedMonth === -1 && feeStatus.color === 'yellow');
                
                let reminderText = `Hello ${student.name}, this is a friendly reminder that your fee of ₹${student.monthlyFees} is pending. Thank you.`;
                if (selectedMonth > -1) {
                    reminderText = `Hello ${student.name}, this is a friendly reminder that your fee of ₹${student.monthlyFees} for the month of ${MONTHS[selectedMonth]} is pending. Thank you.`;
                }
                const whatsappLink = `https://wa.me/${formatPhoneNumber(student.phoneNumber)}?text=${encodeURIComponent(reminderText)}`;

                return (
                  <motion.div key={student.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} className="bg-white rounded-xl shadow-md p-4 border border-gray-100 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 truncate">{student.name}</h3>
                          <p className="text-sm text-gray-600 truncate">{student.standard} • {student.schoolName}</p>
                          <p className="text-xs text-gray-500 mt-1">📞 {student.phoneNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">₹{student.monthlyFees}</p>
                          <p className="text-xs text-gray-500">Monthly</p>
                        </div>
                        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => setManagingStudentId(student.id)} className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-300">
                          <Edit className="h-5 w-5" />
                        </motion.button>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColorClasses[feeStatus.color]}`}>
                          {feeStatus.text} {selectedMonth > -1 ? `for ${MONTHS[selectedMonth]}` : ''}
                        </span>
                        {showReminder ? (
                            <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-green-500 text-white hover:bg-green-600 transition-colors duration-200">
                                <Send className="h-4 w-4" />
                                <span className="text-xs font-semibold">Remind</span>
                            </a>
                        ) : (
                            selectedMonth === -1 && (
                                <span className="text-xs text-gray-500">
                                    {feeStatus.count} / 12 months paid
                                </span>
                            )
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" onClick={() => setShowForm(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-xl shadow-2xl max-w-md w-full p-5" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold text-gray-900 mb-5">Add New Student</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" placeholder="Enter student's full name" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Standard</label>
                  <input type="text" name="standard" value={formData.standard} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" placeholder="Enter standard (e.g., 5th, 10th)" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">School Name</label>
                  <input type="text" name="schoolName" value={formData.schoolName} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" placeholder="Enter school name" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" placeholder="Enter phone number" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Fees (₹)</label>
                  <input type="number" name="monthlyFees" value={formData.monthlyFees} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm" placeholder="Enter monthly fees amount" required />
                </div>
                <div className="flex space-x-3 pt-3">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-sm">Cancel</button>
                  <button type="submit" className="flex-1 px-3 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 text-sm">Add Student</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {managingStudent && (
          <FeeManagerModal 
            student={managingStudent} 
            onClose={() => setManagingStudentId(null)} 
            onUpdate={handleUpdateFees} 
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default App;
