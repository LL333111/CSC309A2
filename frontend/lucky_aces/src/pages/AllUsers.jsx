import { useState, useEffect } from "react";
import { useLoggedInUser } from "../contexts/LoggedInUserContext";
import { getAllUsers } from "../APIRequest" // 改为引用getAllUsers
import { useNavigate } from "react-router-dom";
import "./AllUsers.css";

function AllUsers() {
  const [_loading, _setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [userList, setUserList] = useState([]); // 改为userList

  // 更新过滤器状态
  const [nameFilter, setNameFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("any"); // 新增角色过滤器
  const [verifiedFilter, setVerifiedFilter] = useState("any"); // 新增verified过滤器
  const [activatedFilter, setActivatedFilter] = useState("any"); // 新增activated过滤器

  const { loading, token, role } = useLoggedInUser();
  const navigate = useNavigate();

  // page protection
  useEffect(() => {
    const timer = setTimeout(() => {
      _setLoading(loading);
    }, 500);
    return () => clearTimeout(timer);
  }, [loading]);

  const fetchUsers = async () => { // 改为fetchUsers
    try {
      let name = nameFilter || null;

      // 处理role参数转换
      let roleParam = roleFilter !== "any" ? roleFilter : null;

      // 处理verified参数转换
      let verifiedParam;
      switch (verifiedFilter) {
        case "true":
          verifiedParam = true;
          break;
        case "false":
          verifiedParam = false;
          break;
        default:
          verifiedParam = null; // "any"时传null
      }

      // 处理activated参数转换
      let activatedParam;
      switch (activatedFilter) {
        case "true":
          activatedParam = true;
          break;
        case "false":
          activatedParam = false;
          break;
        default:
          activatedParam = null; // "any"时传null
      }

      const data = await getAllUsers(
        name,
        page,
        roleParam,
        verifiedParam,
        activatedParam,
        token
      );

      if (totalPage === null) {
        setTotalPage(data.count % 5 === 0 ? Math.floor(data.count / 5) : Math.floor(data.count / 5) + 1);
      }
      console.log(data);

      setUserList(data.results); // 改为setUserList
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  useEffect(() => {
    if (!_loading) {
      fetchUsers();
    }
  }, [page, _loading, totalPage]);

  const handlePrevious = (e) => {
    e.preventDefault();
    setPage(page === 1 ? 1 : page - 1);
  }

  const handleNext = (e) => {
    e.preventDefault();
    setPage(page === totalPage ? page : page + 1);
  }

  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  }

  const handleApply = async (e) => {
    e.preventDefault();
    setPage(1);
    setTotalPage(null);
    await fetchUsers(); // 立即获取数据
  }

  const handleReset = (e) => {
    e.preventDefault();
    setNameFilter("");
    setRoleFilter("any");
    setVerifiedFilter("any");
    setActivatedFilter("any");
    setPage(1);
    setTotalPage(null);
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  }

  const getRoleDisplayName = (role) => {
    switch (role) {
      case "regular":
        return "Regular";
      case "cashier":
        return "Cashier";
      case "manager":
        return "Manager";
      case "superuser":
        return "Superuser";
      default:
        return role;
    }
  }

  return (
    <div className="all-users-container">
      {_loading ? (
        <div className="loading-container">
          <h2>Loading...</h2>
          {/* 可以添加加载动画 */}
        </div>
      ) : (
        <div>
          <h1>All Users</h1>
          <button className="filter-toggle-btn" onClick={toggleFilter}>
            {isFilterOpen ? '✕ Hide Filters' : '☰ Show Filters'}
          </button>
          {isFilterOpen && (
            <section className="filter-panel">
              <h2>Filter Users</h2>
              <div className="filter-grid">
                <div className="filter-group">
                  <label htmlFor="name-filter">Name: </label>
                  <input
                    type="text"
                    id="name-filter"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    placeholder="Input User Name.."
                  />
                </div>
                <div className="filter-group">
                  <label htmlFor="role-filter">Role: </label>
                  <select
                    id="role-filter"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="any">Any</option>
                    <option value="regular">Regular</option>
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="superuser">Superuser</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="verified-filter">Verified: </label>
                  <select
                    id="verified-filter"
                    value={verifiedFilter}
                    onChange={(e) => setVerifiedFilter(e.target.value)}
                  >
                    <option value="any">Any</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                </div>
                <div className="filter-group">
                  <label htmlFor="activated-filter">Activated: </label>
                  <select
                    id="activated-filter"
                    value={activatedFilter}
                    onChange={(e) => setActivatedFilter(e.target.value)}
                  >
                    <option value="any">Any</option>
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                </div>
              </div>
              <div className="filter-actions">
                <button className="apply-btn" onClick={handleApply}>Apply Filters</button>
                <button className="reset-btn" onClick={handleReset}>Reset Filters</button>
              </div>
            </section>
          )}

          <div className="users-list">
            {userList.length === 0 ? ( // 改为userList
              <div className="no-users">
                <p>No users found.</p> {/* 改为users */}
              </div>
            ) : (
              userList.map((user) => ( // 改为userList和user
                <div key={user.id} className="user-card">
                  <div className="user-header">
                    <h3 className="user-name">{user.name}</h3>
                    <span className={`user-role-badge role-${user.role}`}>
                      {getRoleDisplayName(user.role)}
                    </span>
                  </div>

                  <div className="user-details">
                    <p><strong>Email: </strong>{user.email}</p>
                    <p><strong>Role: </strong>{getRoleDisplayName(user.role)}</p>
                    <p><strong>Verified: </strong>{user.verified ? "Yes" : "No"}</p>
                    <p><strong>Activated: </strong>{user.activated ? "Yes" : "No"}</p>
                    <p><strong>Registration Date: </strong>{formatDate(user.registrationDate)}</p>
                    <p><strong>Last Login: </strong>{formatDate(user.lastLogin)}</p>
                  </div>
                  <div className="user-admin-actions">
                    <button className="user-update-btn" onClick={() => navigate(`/update_user/${user.id}`)}>Update User</button>
                  </div>
                </div>
              ))
            )}
          </div>

          {userList.length > 0 && ( // 改为userList
            <div className="pagination">
              <button
                onClick={handlePrevious}
                disabled={page === 1}
              >
                Previous Page
              </button>
              <span>
                Page {page} of {totalPage || 1}
              </span>
              <button
                onClick={handleNext}
                disabled={page === totalPage}
              >
                Next Page
              </button>
            </div>
          )}
        </div>
      )
      }
    </div >
  )
}

export default AllUsers;