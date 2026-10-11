import { useEffect, useState } from "react";
import Login from "./Login";
import Signup from "./Signup";
import "./App.css";

const API = "http://localhost:8080/api";

// =========================================================
// SEARCH PAGE
// =========================================================

function SearchPage({
    searchKey,
    setSearchKey,
    handleSearch,
    searchResult,
    searchPath,
}) {
    return (
        <>
            <div className="page-heading">
                <div>
                    <h1>B+ Tree Search</h1>

                    <p>
                        Search for a record using B+ Tree indexing.
                    </p>
                </div>
            </div>

            <div className="panel search-panel">
                <div className="panel-header">
                    <div>
                        <h2>Search by Record Key</h2>

                        <p>
                            Enter a key to perform an indexed lookup.
                        </p>
                    </div>
                </div>

                <div className="search-form">
                    <input
                        type="number"
                        value={searchKey}
                        onChange={(event) =>
                            setSearchKey(event.target.value)
                        }
                        placeholder="Enter record key"
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                handleSearch();
                            }
                        }}
                    />

                    <button
                        className="primary-button"
                        onClick={handleSearch}
                    >
                        Search
                    </button>
                </div>
            </div>

            {searchResult && (
                <div className="panel">
                    <div className="panel-header">
                        <div>
                            <h2>Search Result</h2>

                            <p>
                                Result returned from the B+ Tree indexed
                                search.
                            </p>
                        </div>
                    </div>

                    {searchResult.found === false ? (
                        <div className="empty-state">
                            <div>⌕</div>

                            <h3>Record Not Found</h3>

                            <p>
                                No record exists with key{" "}
                                {searchResult.key}.
                            </p>
                        </div>
                    ) : (
                        <div className="search-result-grid">
                            <div className="result-card">
                                <span>RECORD KEY</span>

                                <strong>
                                    {searchResult.recordKey}
                                </strong>
                            </div>

                            <div className="result-card">
                                <span>NAME</span>

                                <strong>
                                    {searchResult.name || "—"}
                                </strong>
                            </div>

                            <div className="result-card">
                                <span>DATA</span>

                                <strong>
                                    {searchResult.data || "—"}
                                </strong>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {searchPath && (
                <div className="panel">
                    <div className="panel-header">
                        <div>
                            <h2>B+ Tree Search Path</h2>

                            <p>
                                Nodes visited during the indexed search.
                            </p>
                        </div>
                    </div>

                    <div className="search-path">
                        {Array.isArray(searchPath) ? (
                            searchPath.map((node, index) => (
                                <div
                                    className="path-node"
                                    key={index}
                                >
                                    <span>
                                        Step {index + 1}
                                    </span>

                                    <strong>
                                        {typeof node === "object"
                                            ? JSON.stringify(node)
                                            : node}
                                    </strong>
                                </div>
                            ))
                        ) : (
                            <pre>
                                {JSON.stringify(
                                    searchPath,
                                    null,
                                    2
                                )}
                            </pre>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}

// =========================================================
// APP
// =========================================================

function App() {

    // =========================================================
    // AUTHENTICATION
    // =========================================================

    const [isLoggedIn, setIsLoggedIn] = useState(
        () => !!localStorage.getItem("cloudDataToken")
    );

    const [showSignup, setShowSignup] = useState(false);

    const handleLogin = () => {
        setIsLoggedIn(true);
        setShowSignup(false);
    };

    const handleLogout = () => {
        localStorage.removeItem("cloudDataToken");
        localStorage.removeItem("cloudDataUser");

        setIsLoggedIn(false);
        setShowSignup(false);
    };

    // =========================================================
    // AUTH FETCH
    // =========================================================

    const authFetch = async (url, options = {}) => {

        const token =
            localStorage.getItem("cloudDataToken");

        const headers = {
            ...(options.headers || {}),
            ...(token
                ? {
                      Authorization: `Bearer ${token}`,
                  }
                : {}),
        };

        const response = await window.fetch(url, {
            ...options,
            headers,
        });

        // JWT expired / invalid
        if (
            response.status === 401 ||
            response.status === 403
        ) {
            handleLogout();
        }

        return response;
    };

    // =========================================================
    // DELETE ACCOUNT PERMANENTLY
    // =========================================================

    const handleDeleteAccount = async () => {

        const confirmed = window.confirm(
            "Are you sure you want to permanently delete your account?\n\n" +
            "This will permanently delete:\n" +
            "• Your account\n" +
            "• All your records\n" +
            "• Your B+ Tree data\n\n" +
            "This action cannot be undone."
        );

        if (!confirmed) {
            return;
        }

        try {

            const response = await authFetch(
                `${API}/auth/account`,
                {
                    method: "DELETE",
                }
            );

            const result = await response
                .json()
                .catch(() => null);

            if (!response.ok) {
                throw new Error(
                    result?.message ||
                        "Unable to delete account."
                );
            }

            // Remove login information
            localStorage.removeItem("cloudDataToken");
            localStorage.removeItem("cloudDataUser");

            // Reset application state
            setRecords([]);
            setTree(null);

            setStats({
                totalRecords: 0,
                totalNodes: 0,
                leafNodes: 0,
                height: 1,
                order: 4,
            });

            setIsLoggedIn(false);
            setShowSignup(false);

            setMessage("");
            setError("");

        } catch (err) {

            setError(
                err.message ||
                    "Unable to delete account."
            );
        }
    };

    // =========================================================
    // STATE
    // =========================================================

    const [activePage, setActivePage] =
        useState("dashboard");

    const [records, setRecords] =
        useState([]);

    const [stats, setStats] = useState({
        totalRecords: 0,
        totalNodes: 0,
        leafNodes: 0,
        height: 1,
        order: 4,
    });

    const [tree, setTree] =
        useState(null);

    const [form, setForm] = useState({
        recordKey: "",
        name: "",
        data: "",
    });

    const [searchKey, setSearchKey] =
        useState("");

    const [searchResult, setSearchResult] =
        useState(null);

    const [searchPath, setSearchPath] =
        useState(null);

    const [startKey, setStartKey] =
        useState("");

    const [endKey, setEndKey] =
        useState("");

    const [rangeResults, setRangeResults] =
        useState([]);

    const [message, setMessage] =
        useState("");

    const [error, setError] =
        useState("");

    const [performanceResult, setPerformanceResult] =
        useState(null);

    // =========================================================
    // LOAD DASHBOARD
    // =========================================================

    const loadDashboard = async () => {

        try {

            setError("");

            const [
                recordsResponse,
                statsResponse,
                treeResponse,
            ] = await Promise.all([
                authFetch(`${API}/records`),
                authFetch(`${API}/tree/statistics`),
                authFetch(`${API}/tree`),
            ]);

            if (
                !recordsResponse.ok ||
                !statsResponse.ok ||
                !treeResponse.ok
            ) {
                throw new Error(
                    "Unable to load dashboard data."
                );
            }

            const recordsData =
                await recordsResponse.json();

            const statsData =
                await statsResponse.json();

            const treeData =
                await treeResponse.json();

            setRecords(recordsData);
            setStats(statsData);
            setTree(treeData);

        } catch (err) {

            setError(
                err.message ||
                    "Cannot connect to backend. Make sure Spring Boot is running on port 8080."
            );
        }
    };

    // =========================================================
    // LOAD AFTER LOGIN
    // =========================================================

    useEffect(() => {

        if (isLoggedIn) {
            loadDashboard();
        }

    }, [isLoggedIn]);

    // =========================================================
    // NAVIGATION
    // =========================================================

    const navigate = (page) => {

        setActivePage(page);

        setMessage("");
        setError("");

        if (page !== "search") {
            setSearchResult(null);
            setSearchPath(null);
        }

        if (page !== "range") {
            setRangeResults([]);
        }
    };

    // =========================================================
    // ADD RECORD
    // =========================================================

    const handleAddRecord = async (event) => {

        event.preventDefault();

        setMessage("");
        setError("");

        if (
            form.recordKey === "" ||
            !form.name.trim()
        ) {
            setError(
                "Record Key and Name are required."
            );

            return;
        }

        const key = Number(form.recordKey);

        if (!Number.isInteger(key)) {
            setError(
                "Record Key must be a valid integer."
            );

            return;
        }

        try {

            const response = await authFetch(
                `${API}/records`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        recordKey: key,
                        name: form.name.trim(),
                        data: form.data,
                    }),
                }
            );

            const result = await response
                .json()
                .catch(() => null);

            if (!response.ok) {

                throw new Error(
                    typeof result === "string"
                        ? result
                        : result?.message ||
                              "Unable to add record."
                );
            }

            setForm({
                recordKey: "",
                name: "",
                data: "",
            });

            setMessage(
                "Record added successfully to MySQL and B+ Tree."
            );

            await loadDashboard();

        } catch (err) {

            setError(
                err.message ||
                    "Unable to add record."
            );
        }
    };

    // =========================================================
    // B+ TREE SEARCH
    // =========================================================

    const handleSearch = async () => {

        setMessage("");
        setError("");
        setSearchResult(null);
        setSearchPath(null);

        if (searchKey === "") {

            setError(
                "Enter a record key."
            );

            return;
        }

        const key = Number(searchKey);

        if (!Number.isInteger(key)) {

            setError(
                "Record key must be a valid integer."
            );

            return;
        }

        try {

            const [
                searchResponse,
                pathResponse,
            ] = await Promise.all([
                authFetch(
                    `${API}/records/${key}`
                ),

                authFetch(
                    `${API}/tree/search-path/${key}`
                ),
            ]);

            if (pathResponse.ok) {

                const pathData =
                    await pathResponse.json();

                setSearchPath(pathData);
            }

            if (searchResponse.status === 404) {

                setSearchResult({
                    found: false,
                    key: key,
                });

                return;
            }

            if (!searchResponse.ok) {
                throw new Error(
                    "Search failed."
                );
            }

            const responseData =
                await searchResponse.json();

            console.log(
                "B+ Tree Search Response:",
                responseData
            );

            const record =
                responseData.value ||
                responseData.record ||
                responseData;

            const recordKey =
                record.recordKey ??
                responseData.key ??
                key;

            const name =
                record.name ??
                responseData.name ??
                "—";

            const data =
                record.data ??
                responseData.data ??
                "—";

            setSearchResult({
                found: true,
                key: recordKey,
                recordKey: recordKey,
                name: name,
                data: data,

                value: {
                    name: name,
                    data: data,
                },
            });

        } catch (err) {

            console.error(
                "B+ Tree Search Error:",
                err
            );

            setError(
                err.message ||
                    "Search failed."
            );
        }
    };

    // =========================================================
    // RANGE SEARCH
    // =========================================================

    const handleRangeSearch = async () => {

        setMessage("");
        setError("");
        setRangeResults([]);

        if (
            startKey === "" ||
            endKey === ""
        ) {

            setError(
                "Enter both start and end keys."
            );

            return;
        }

        const start = Number(startKey);
        const end = Number(endKey);

        if (
            !Number.isInteger(start) ||
            !Number.isInteger(end)
        ) {

            setError(
                "Keys must be valid integers."
            );

            return;
        }

        if (start > end) {

            setError(
                "Start key must be less than or equal to end key."
            );

            return;
        }

        try {

            const response = await authFetch(
                `${API}/records/range?startKey=${start}&endKey=${end}`
            );

            if (!response.ok) {

                throw new Error(
                    "Range search failed."
                );
            }

            const data =
                await response.json();

            const normalizedResults =
                Array.isArray(data)
                    ? data.map(
                          (item) =>
                              item?.value ??
                              item
                      )
                    : [];

            setRangeResults(
                normalizedResults
            );

        } catch (err) {

            setError(
                err.message ||
                    "Range search failed."
            );
        }
    };

    // =========================================================
    // DELETE RECORD
    // =========================================================

    const handleDelete = async (key) => {

        setMessage("");
        setError("");

        const confirmed = window.confirm(
            `Delete record with key ${key}?`
        );

        if (!confirmed) {
            return;
        }

        try {

            const response =
                await authFetch(
                    `${API}/records/${key}`,
                    {
                        method: "DELETE",
                    }
                );

            if (!response.ok) {

                throw new Error(
                    "Unable to delete record."
                );
            }

            setMessage(
                "Record deleted successfully."
            );

            await loadDashboard();

        } catch (err) {

            setError(
                err.message ||
                    "Unable to delete record."
            );
        }
    };

    // =========================================================
    // PERFORMANCE TEST
    // =========================================================

    const runPerformanceTest = async () => {

        setMessage("");
        setError("");
        setPerformanceResult(null);

        if (records.length === 0) {

            setError(
                "Add some records before running the performance test."
            );

            return;
        }

        const iterations = 20;

        const targetIndex =
            Math.floor(
                records.length / 2
            );

        const targetKey =
            records[targetIndex].recordKey;

        try {

            // B+ TREE SEARCH

            const bPlusStart =
                window.performance.now();

            for (
                let i = 0;
                i < iterations;
                i++
            ) {

                const response =
                    await authFetch(
                        `${API}/records/${targetKey}`
                    );

                if (!response.ok) {

                    throw new Error(
                        "B+ Tree search request failed."
                    );
                }

                await response.json();
            }

            const bPlusEnd =
                window.performance.now();

            // NORMAL LINEAR SCAN

            const normalStart =
                window.performance.now();

            for (
                let i = 0;
                i < iterations;
                i++
            ) {

                records.find(
                    (record) =>
                        record.recordKey ===
                        targetKey
                );
            }

            const normalEnd =
                window.performance.now();

            // CALCULATE

            const bPlusTotal =
                bPlusEnd - bPlusStart;

            const normalTotal =
                normalEnd - normalStart;

            const bPlusTime =
                bPlusTotal / iterations;

            const normalTime =
                normalTotal / iterations;

            let difference = 0;

            if (normalTime > 0) {

                difference =
                    ((normalTime - bPlusTime) /
                        normalTime) *
                    100;
            }

            setPerformanceResult({
                bPlusTime,
                normalTime,
                iterations,
                difference,
                targetKey,
                totalRecords:
                    records.length,
            });

        } catch (err) {

            setError(
                "Performance test failed: " +
                    err.message
            );
        }
    };

    // =========================================================
    // STAT CARD
    // =========================================================

    const StatCard = ({
        title,
        value,
        icon,
    }) => {

        return (
            <div className="stat-card">

                <div className="stat-icon">
                    {icon}
                </div>

                <div>

                    <div className="stat-title">
                        {title}
                    </div>

                    <div className="stat-value">
                        {value}
                    </div>

                </div>

            </div>
        );
    };

    // =========================================================
    // RECORD TABLE
    // =========================================================

    const RecordTable = ({
        data,
        compact = false,
    }) => {

        return (
            <div className="table-wrapper">

                {data.length === 0 ? (

                    <div className="empty-state">

                        <div>▤</div>

                        <h3>
                            No records available
                        </h3>

                        <p>
                            Add your first record
                            to get started.
                        </p>

                    </div>

                ) : (

                    <table>

                        <thead>

                            <tr>

                                <th>Key</th>
                                <th>Name</th>
                                <th>Data</th>
                                <th>Created</th>

                                {!compact && (
                                    <th>Action</th>
                                )}

                            </tr>

                        </thead>

                        <tbody>

                            {data.map(
                                (
                                    record,
                                    index
                                ) => (

                                    <tr
                                        key={
                                            record.id ??
                                            record.recordKey ??
                                            index
                                        }
                                    >

                                        <td>

                                            <span className="key-badge">
                                                {
                                                    record.recordKey
                                                }
                                            </span>

                                        </td>

                                        <td>

                                            <strong>
                                                {
                                                    record.name ||
                                                    "—"
                                                }
                                            </strong>

                                        </td>

                                        <td>

                                            <span className="data-text">
                                                {
                                                    record.data ||
                                                    "—"
                                                }
                                            </span>

                                        </td>

                                        <td>

                                            {record.createdAt
                                                ? new Date(
                                                      record.createdAt
                                                  ).toLocaleString()
                                                : "—"}

                                        </td>

                                        {!compact && (

                                            <td>

                                                <button
                                                    className="delete-button"
                                                    onClick={() =>
                                                        handleDelete(
                                                            record.recordKey
                                                        )
                                                    }
                                                >
                                                    Delete
                                                </button>

                                            </td>

                                        )}

                                    </tr>

                                )
                            )}

                        </tbody>

                    </table>

                )}

            </div>
        );
    };

    // =========================================================
    // DASHBOARD
    // =========================================================

    const Dashboard = () => {

        return (
            <>

                <div className="page-heading">

                    <div>

                        <h1>
                            Dashboard
                        </h1>

                        <p>
                            Manage and analyze your
                            cloud data using B+ Tree
                            indexing.
                        </p>

                    </div>

                    <button
                        className="primary-button"
                        onClick={() =>
                            navigate("add")
                        }
                    >
                        + Add Record
                    </button>

                </div>

                <div className="stats-grid">

                    <StatCard
                        title="Total Records"
                        value={
                            stats.totalRecords
                        }
                        icon="▣"
                    />

                    <StatCard
                        title="Tree Height"
                        value={
                            stats.height
                        }
                        icon="↕"
                    />

                    <StatCard
                        title="Total Nodes"
                        value={
                            stats.totalNodes
                        }
                        icon="◇"
                    />

                    <StatCard
                        title="Leaf Nodes"
                        value={
                            stats.leafNodes
                        }
                        icon="◆"
                    />

                </div>

                <div className="dashboard-grid">

                    <div className="panel">

                        <div className="panel-header">

                            <div>

                                <h2>
                                    Quick Actions
                                </h2>

                                <p>
                                    Access the main
                                    data management
                                    operations.
                                </p>

                            </div>

                        </div>

                        <div className="quick-actions">

                            <button
                                onClick={() =>
                                    navigate("add")
                                }
                            >

                                <span>＋</span>

                                <strong>
                                    Add Record
                                </strong>

                                <small>
                                    Insert new data
                                </small>

                            </button>

                            <button
                                onClick={() =>
                                    navigate(
                                        "records"
                                    )
                                }
                            >

                                <span>▤</span>

                                <strong>
                                    View Records
                                </strong>

                                <small>
                                    Browse all records
                                </small>

                            </button>

                            <button
                                onClick={() =>
                                    navigate(
                                        "search"
                                    )
                                }
                            >

                                <span>⌕</span>

                                <strong>
                                    Search
                                </strong>

                                <small>
                                    Find using B+ Tree
                                </small>

                            </button>

                            <button
                                onClick={() =>
                                    navigate(
                                        "tree"
                                    )
                                }
                            >

                                <span>⌘</span>

                                <strong>
                                    View B+ Tree
                                </strong>

                                <small>
                                    Explore tree structure
                                </small>

                            </button>

                        </div>

                    </div>

                    <div className="panel tree-info-panel">

                        <div className="panel-header">

                            <div>

                                <h2>
                                    Tree Information
                                </h2>

                                <p>
                                    Current B+ Tree
                                    configuration.
                                </p>

                            </div>

                            <span className="active-badge">
                                ● Active
                            </span>

                        </div>

                        <div className="info-list">

                            <div>
                                <span>
                                    Tree Order
                                </span>

                                <strong>
                                    {stats.order}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Height
                                </span>

                                <strong>
                                    {stats.height}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Total Nodes
                                </span>

                                <strong>
                                    {stats.totalNodes}
                                </strong>
                            </div>

                            <div>
                                <span>
                                    Leaf Nodes
                                </span>

                                <strong>
                                    {stats.leafNodes}
                                </strong>
                            </div>

                        </div>

                    </div>

                </div>

                <div className="panel">

                    <div className="panel-header">

                        <div>

                            <h2>
                                Recent Records
                            </h2>

                            <p>
                                Latest records stored
                                in the cloud database.
                            </p>

                        </div>

                        <button
                            className="secondary-button"
                            onClick={() =>
                                navigate(
                                    "records"
                                )
                            }
                        >
                            View All
                        </button>

                    </div>

                    <RecordTable
                        data={
                            records.slice(0, 5)
                        }
                        compact={true}
                    />

                </div>

            </>
        );
    };

    // =========================================================
    // ADD RECORD PAGE
    // =========================================================

    const AddRecord = () => {

        return (
            <>

                <div className="page-heading">

                    <div>

                        <h1>
                            Add Record
                        </h1>

                        <p>
                            Insert a new record into
                            MySQL and the B+ Tree.
                        </p>

                    </div>

                </div>

                <div className="panel form-panel">

                    <div className="panel-header">

                        <div>

                            <h2>
                                Record Details
                            </h2>

                            <p>
                                Enter the information
                                for the new record.
                            </p>

                        </div>

                    </div>

                    <form
                        className="record-form"
                        onSubmit={
                            handleAddRecord
                        }
                    >

                        <div className="form-group">

                            <label>
                                Record Key
                            </label>

                            <input
                                type="number"
                                value={
                                    form.recordKey
                                }
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        recordKey:
                                            event
                                                .target
                                                .value,
                                    })
                                }
                                placeholder="Enter numeric key"
                            />

                        </div>

                        <div className="form-group">

                            <label>
                                Name
                            </label>

                            <input
                                type="text"
                                value={
                                    form.name
                                }
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        name:
                                            event
                                                .target
                                                .value,
                                    })
                                }
                                placeholder="Enter record name"
                            />

                        </div>

                        <div className="form-group full-width">

                            <label>
                                Data
                            </label>

                            <textarea
                                value={
                                    form.data
                                }
                                onChange={(event) =>
                                    setForm({
                                        ...form,
                                        data:
                                            event
                                                .target
                                                .value,
                                    })
                                }
                                placeholder="Enter record data"
                                rows="5"
                            />

                        </div>

                        <div className="form-actions">

                            <button
                                type="button"
                                className="secondary-button"
                                onClick={() =>
                                    navigate(
                                        "dashboard"
                                    )
                                }
                            >
                                Cancel
                            </button>

                            <button
                                type="submit"
                                className="primary-button"
                            >
                                Add Record
                            </button>

                        </div>

                    </form>

                </div>

            </>
        );
    };

    // =========================================================
    // ALL RECORDS
    // =========================================================

    const RecordsPage = () => {

        return (
            <>

                <div className="page-heading">

                    <div>

                        <h1>
                            All Records
                        </h1>

                        <p>
                            Browse all records stored
                            in the cloud database.
                        </p>

                    </div>

                    <button
                        className="primary-button"
                        onClick={() =>
                            navigate("add")
                        }
                    >
                        + Add Record
                    </button>

                </div>

                <div className="panel">

                    <div className="panel-header">

                        <div>

                            <h2>
                                Records
                            </h2>

                            <p>
                                {records.length}{" "}
                                record(s)
                                currently stored.
                            </p>

                        </div>

                        <button
                            className="secondary-button"
                            onClick={
                                loadDashboard
                            }
                        >
                            ↻ Refresh
                        </button>

                    </div>

                    <RecordTable
                        data={records}
                    />

                </div>

            </>
        );
    };

    // =========================================================
    // RANGE SEARCH PAGE
    // =========================================================

    const RangePage = () => {

        return (
            <>

                <div className="page-heading">

                    <div>

                        <h1>
                            Range Search
                        </h1>

                        <p>
                            Find all records between
                            two keys using the B+ Tree.
                        </p>

                    </div>

                </div>

                <div className="panel">

                    <div className="panel-header">

                        <div>

                            <h2>
                                Search Range
                            </h2>

                            <p>
                                Enter the starting and
                                ending record keys.
                            </p>

                        </div>

                    </div>

                    <div className="range-form">

                        <div className="form-group">

                            <label>
                                Start Key
                            </label>

                            <input
                                type="number"
                                value={startKey}
                                onChange={(event) =>
                                    setStartKey(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="Start"
                            />

                        </div>

                        <div className="range-arrow">
                            →
                        </div>

                        <div className="form-group">

                            <label>
                                End Key
                            </label>

                            <input
                                type="number"
                                value={endKey}
                                onChange={(event) =>
                                    setEndKey(
                                        event
                                            .target
                                            .value
                                    )
                                }
                                placeholder="End"
                            />

                        </div>

                        <button
                            className="primary-button"
                            onClick={
                                handleRangeSearch
                            }
                        >
                            Search Range
                        </button>

                    </div>

                </div>

                <div className="panel">

                    <div className="panel-header">

                        <div>

                            <h2>
                                Range Results
                            </h2>

                            <p>
                                {rangeResults.length}{" "}
                                record(s) found.
                            </p>

                        </div>

                    </div>

                    <RecordTable
                        data={rangeResults}
                        compact={true}
                    />

                </div>

            </>
        );
    };

    // =========================================================
    // B+ TREE PAGE
    // =========================================================

    const TreePage = () => {

        const leafNodes =
            tree?.nodes?.filter(
                (node) => node.leaf
            ) || [];

        return (
            <>

                <div className="page-heading">

                    <div>

                        <h1>
                            B+ Tree
                        </h1>

                        <p>
                            Visual representation of
                            the current B+ Tree structure.
                        </p>

                    </div>

                    <button
                        className="secondary-button"
                        onClick={
                            loadDashboard
                        }
                    >
                        ↻ Refresh Tree
                    </button>

                </div>

                <div className="tree-summary">

                    <div>
                        <span>Order</span>

                        <strong>
                            {tree?.order ?? 4}
                        </strong>
                    </div>

                    <div>
                        <span>Height</span>

                        <strong>
                            {tree?.height ?? 1}
                        </strong>
                    </div>

                    <div>
                        <span>Nodes</span>

                        <strong>
                            {tree?.totalNodes ?? 0}
                        </strong>
                    </div>

                    <div>
                        <span>Leaves</span>

                        <strong>
                            {tree?.leafNodes ?? 0}
                        </strong>
                    </div>

                </div>

                <div className="panel tree-panel">

                    {!tree ||
                    !tree.nodes?.length ? (

                        <div className="empty-state">

                            <div>◇</div>

                            <h3>
                                B+ Tree is empty
                            </h3>

                            <p>
                                Add records to build
                                the tree.
                            </p>

                        </div>

                    ) : (

                        <>

                            <div className="tree-levels">

                                {tree.levels?.map(
                                    (
                                        level,
                                        levelIndex
                                    ) => (

                                        <div
                                            className="tree-level"
                                            key={
                                                levelIndex
                                            }
                                        >

                                            <div className="level-label">
                                                Level{" "}
                                                {
                                                    levelIndex
                                                }
                                            </div>

                                            <div className="level-nodes">

                                                {level.map(
                                                    (
                                                        node
                                                    ) => (

                                                        <div
                                                            className={
                                                                node.leaf
                                                                    ? "tree-node leaf-node"
                                                                    : "tree-node internal-node"
                                                            }
                                                            key={
                                                                node.id
                                                            }
                                                        >

                                                            <div className="node-type">

                                                                {node.leaf
                                                                    ? "LEAF NODE"
                                                                    : "INTERNAL NODE"}

                                                            </div>

                                                            <div className="node-keys">

                                                                {node.keys?.map(
                                                                    (
                                                                        key
                                                                    ) => (

                                                                        <span
                                                                            key={
                                                                                key
                                                                            }
                                                                        >
                                                                            {
                                                                                key
                                                                            }
                                                                        </span>

                                                                    )
                                                                )}

                                                            </div>

                                                            {node.leaf && (

                                                                <small>
                                                                    {
                                                                        node.recordCount
                                                                    }{" "}
                                                                    record(s)
                                                                </small>

                                                            )}

                                                        </div>

                                                    )
                                                )}

                                            </div>

                                        </div>

                                    )
                                )}

                            </div>

                            <div className="leaf-chain">

                                <h3>
                                    Leaf Node Linked
                                    List
                                </h3>

                                <div className="leaf-chain-items">

                                    {leafNodes.map(
                                        (
                                            node,
                                            index
                                        ) => (

                                            <div
                                                className="chain-item"
                                                key={
                                                    node.id
                                                }
                                            >

                                                <div>

                                                    <strong>
                                                        Leaf{" "}
                                                        {
                                                            index +
                                                            1
                                                        }
                                                    </strong>

                                                    <span>
                                                        [
                                                        {node.keys?.join(
                                                            ", "
                                                        )}
                                                        ]
                                                    </span>

                                                </div>

                                                {index <
                                                    leafNodes.length -
                                                        1 && (

                                                    <b>
                                                        →
                                                    </b>

                                                )}

                                            </div>

                                        )
                                    )}

                                </div>

                            </div>

                        </>

                    )}

                </div>

            </>
        );
    };

    // =========================================================
    // PERFORMANCE PAGE
    // =========================================================

    const PerformancePage = () => {

        return (
            <>

                <div className="page-heading">

                    <div>

                        <h1>
                            Performance Analysis
                        </h1>

                        <p>
                            Compare B+ Tree indexed
                            retrieval with normal
                            scanning.
                        </p>

                    </div>

                    <button
                        className="primary-button"
                        onClick={
                            runPerformanceTest
                        }
                    >
                        Run Test
                    </button>

                </div>

                <div className="panel">

                    <div className="performance-note">

                        <strong>
                            Performance Benchmark
                        </strong>

                        <p>
                            Run the test to measure
                            B+ Tree search requests
                            and compare them with a
                            normal linear scan.
                        </p>

                    </div>

                </div>

                {!performanceResult && (

                    <div className="panel">

                        <div className="empty-state">

                            <div>◴</div>

                            <h3>
                                Performance test ready
                            </h3>

                            <p>
                                Click "Run Test" to
                                measure retrieval
                                performance.
                            </p>

                        </div>

                    </div>

                )}

                {performanceResult && (

                    <>

                        <div className="performance-grid">

                            <div className="performance-card">

                                <span>
                                    B+ TREE SEARCH
                                </span>

                                <strong>
                                    {performanceResult.bPlusTime.toFixed(
                                        3
                                    )}
                                </strong>

                                <small>
                                    ms / request
                                </small>

                            </div>

                            <div className="performance-card">

                                <span>
                                    NORMAL SCAN
                                </span>

                                <strong>
                                    {performanceResult.normalTime.toFixed(
                                        3
                                    )}
                                </strong>

                                <small>
                                    ms / request
                                </small>

                            </div>

                            <div className="performance-card">

                                <span>
                                    ITERATIONS
                                </span>

                                <strong>
                                    {
                                        performanceResult.iterations
                                    }
                                </strong>

                                <small>
                                    requests
                                </small>

                            </div>

                            <div className="performance-card">

                                <span>
                                    MEASURED DIFFERENCE
                                </span>

                                <strong>
                                    {performanceResult.difference.toFixed(
                                        2
                                    )}
                                    %
                                </strong>

                                <small>
                                    based on browser test
                                </small>

                            </div>

                        </div>

                        <div className="panel">

                            <div className="panel-header">

                                <div>

                                    <h2>
                                        Test Details
                                    </h2>

                                    <p>
                                        Information about
                                        the benchmark that
                                        was just executed.
                                    </p>

                                </div>

                            </div>

                            <div className="tree-summary">

                                <div>

                                    <span>
                                        Test Record
                                    </span>

                                    <strong>
                                        Key{" "}
                                        {
                                            performanceResult.targetKey
                                        }
                                    </strong>

                                </div>

                                <div>

                                    <span>
                                        Dataset Size
                                    </span>

                                    <strong>
                                        {
                                            performanceResult.totalRecords
                                        }
                                    </strong>

                                </div>

                                <div>

                                    <span>
                                        B+ Tree
                                    </span>

                                    <strong>
                                        Indexed
                                    </strong>

                                </div>

                                <div>

                                    <span>
                                        Normal Method
                                    </span>

                                    <strong>
                                        Linear Scan
                                    </strong>

                                </div>

                            </div>

                        </div>

                    </>

                )}

            </>
        );
    };

    // =========================================================
    // PAGE ROUTER
    // =========================================================

    const renderPage = () => {

        switch (activePage) {

            case "add":
                return <AddRecord />;

            case "records":
                return <RecordsPage />;

            case "search":
                return (
                    <SearchPage
                        searchKey={searchKey}
                        setSearchKey={setSearchKey}
                        handleSearch={handleSearch}
                        searchResult={
                            searchResult
                        }
                        searchPath={
                            searchPath
                        }
                    />
                );

            case "range":
                return <RangePage />;

            case "tree":
                return <TreePage />;

            case "performance":
                return <PerformancePage />;

            case "dashboard":
            default:
                return <Dashboard />;
        }
    };

    // =========================================================
    // LOGIN / SIGNUP CHECK
    // =========================================================

    if (!isLoggedIn) {

        if (showSignup) {

            return (
                <Signup
                    onSignupSuccess={() => {
                        setShowSignup(false);
                    }}
                    onBackToLogin={() => {
                        setShowSignup(false);
                    }}
                />
            );
        }

        return (
            <Login
                onLogin={handleLogin}
                onSignup={() => {
                    setShowSignup(true);
                }}
            />
        );
    }

    // =========================================================
    // MAIN UI
    // =========================================================

    return (

        <div className="app">

            {/* SIDEBAR */}

            <aside className="sidebar">

                <div className="brand">

                    <div className="brand-icon">
                        ☁
                    </div>

                    <div>

                        <h2>
                            Cloud Data
                        </h2>

                        <span>
                            Management System
                        </span>

                    </div>

                </div>

                <nav>

                    <div className="nav-section">
                        MAIN
                    </div>

                    <button
                        className={
                            activePage ===
                            "dashboard"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            navigate(
                                "dashboard"
                            )
                        }
                    >

                        <span>⌂</span>

                        Dashboard

                    </button>

                    <button
                        className={
                            activePage === "add"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            navigate("add")
                        }
                    >

                        <span>＋</span>

                        Add Record

                    </button>

                    <button
                        className={
                            activePage ===
                            "records"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            navigate(
                                "records"
                            )
                        }
                    >

                        <span>▤</span>

                        All Records

                    </button>

                    <div className="nav-section">
                        INDEXING
                    </div>

                    <button
                        className={
                            activePage ===
                            "search"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            navigate(
                                "search"
                            )
                        }
                    >

                        <span>⌕</span>

                        B+ Tree Search

                    </button>

                    <button
                        className={
                            activePage ===
                            "range"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            navigate(
                                "range"
                            )
                        }
                    >

                        <span>⇄</span>

                        Range Search

                    </button>

                    <button
                        className={
                            activePage === "tree"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            navigate("tree")
                        }
                    >

                        <span>◇</span>

                        B+ Tree

                    </button>

                    <div className="nav-section">
                        ANALYSIS
                    </div>

                    <button
                        className={
                            activePage ===
                            "performance"
                                ? "nav-item active"
                                : "nav-item"
                        }
                        onClick={() =>
                            navigate(
                                "performance"
                            )
                        }
                    >

                        <span>◴</span>

                        Performance

                    </button>

                </nav>

                <div className="sidebar-footer">

                    <div className="status-dot"></div>

                    <div>

                        <strong>
                            System Online
                        </strong>

                        <span>
                            Spring Boot API
                        </span>

                    </div>

                </div>

            </aside>

            {/* MAIN */}

            <main className="main">

                {/* TOP BAR */}

                <header className="topbar">

                    <div>

                        <span className="topbar-label">
                            CLOUD DATA PLATFORM
                        </span>

                        <strong>
                            B+ Tree Indexed Storage
                        </strong>

                    </div>

                    <div className="connection-status">

                        <span></span>

                        Backend Connected

                        <button
                            type="button"
                            className="delete-account-button"
                            onClick={
                                handleDeleteAccount
                            }
                        >
                            Delete Account
                        </button>

                        <button
                            type="button"
                            className="logout-button"
                            onClick={
                                handleLogout
                            }
                        >
                            Logout
                        </button>

                    </div>

                </header>

                {/* CONTENT */}

                <div className="content">

                    {message && (

                        <div className="alert success-alert">
                            ✓ {message}
                        </div>

                    )}

                    {error && (

                        <div className="alert error-alert">
                            ⚠ {error}
                        </div>

                    )}

                    {renderPage()}

                </div>

            </main>

        </div>
    );
}

export default App;