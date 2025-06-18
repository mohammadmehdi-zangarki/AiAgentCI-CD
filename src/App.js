import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './components/Login';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Chat from './components/Chat/Chat';
import { Document, DocumentIndex, DomainIndex, EditDocument } from './components/Chat/Document';
import Wizard from './components/Chat/Wizard';
import Workflow from './components/Workflow/WorkflowIndex';
import WorkflowEditor from './components/Workflow/editor/WorkflowEditor';
import { getVersion } from './utils/apis';
import CrawlUrl from './components/Chat/CrawlUrl';
import Status1 from './components/Chat/Status';
import InstructionIndex from './components/Chat/Instruction/InstructionIndex';
import CreateInstruction from './components/Chat/Instruction/CreateInstruction';
import EditInstruction from './components/Chat/Instruction/EditInstruction';


function App() {
    return (
        <AuthProvider>
            <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <AppContent />
            </Router>
        </AuthProvider>
    );
}

function AppContent() {
    const location = useLocation();
    const showNavbar = location.pathname !== '/login';
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [appVersion, setAppVersion] = useState(null)

    useEffect(() => {
        const fetchVersion = async () => {
            try{
                const res = await getVersion()
                setAppVersion(res.version)
            } catch (err) {
                setAppVersion('undefined')
            }
        }

        fetchVersion()
    }, [])


    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            {showNavbar && <Navbar onSidebarCollapse={setSidebarCollapsed} />}
            <div
                className={`transition-all duration-300 ${showNavbar
                    ? (sidebarCollapsed ? 'md:mr-0' : 'md:mr-64')
                    : 'flex items-center justify-center'
                    }`}
            >
                <Routes>
                    <Route path="/login" element={<Login />} />

                    <Route
                        path="/"
                        element={<Navigate to="/chat" replace />}
                    />

                    <Route
                        path="/chat"
                        element={
                            <PrivateRoute>
                                <Chat />
                            </PrivateRoute>
                        }
                    />
                
                    /** Document routes */
                    <Route>
                        <Route
                            path="/document"
                            element={
                                <PrivateRoute>
                                    <Document />
                                </PrivateRoute>
                            }
                        >
                            <Route
                                path=''
                                element={<Navigate to="domains" />}
                            />
                            <Route
                                path="domains"
                                element={
                                    <PrivateRoute>
                                        <DomainIndex />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="domain/:domain_id"
                                element={
                                    <PrivateRoute>
                                        <DocumentIndex />
                                    </PrivateRoute>
                                }
                            />
                            <Route
                                path="manuals"
                                element={
                                    <PrivateRoute>
                                        <DocumentIndex />
                                    </PrivateRoute>
                                }
                            />
                        </Route>
                    </Route>
                    <Route
                        path="document/edit/:document_id"
                        element={
                            <PrivateRoute>
                                <EditDocument />
                            </PrivateRoute>
                        }
                    />

                    <Route
                        path="/processes"
                        element={
                            <PrivateRoute>
                                <Status1 />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path='crawl-url'
                        element={<CrawlUrl/>}
                    />
                    <Route
                        path="/wizard"
                        element={
                            <PrivateRoute>
                                <Wizard />
                            </PrivateRoute>
                        }
                    />
                    <Route path="/workflow">
                        <Route
                            index
                            element={
                                <PrivateRoute>
                                    <Workflow />
                                </PrivateRoute>
                            }
                        />
                        <Route 
                            path=":workflowId"
                            element={
                                <PrivateRoute>
                                    <WorkflowEditor />
                                </PrivateRoute>
                            }
                        />
                        <Route 
                            path="create"
                            element={
                                <PrivateRoute>
                                    <WorkflowEditor />
                                </PrivateRoute>
                            }
                        />
                    </Route>

                    {/* Instruction Routes */}
                    <Route path="/instructions">
                        <Route
                            index
                            element={
                                <PrivateRoute>
                                    <InstructionIndex />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="create"
                            element={
                                <PrivateRoute>
                                    <CreateInstruction />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="edit/:id"
                            element={
                                <PrivateRoute>
                                    <EditInstruction />
                                </PrivateRoute>
                            }
                        />
                    </Route>
                </Routes>
                <span style={{position:'fixed', bottom: "5px", left: "10px"}}>
                    نسخه : {appVersion}
                </span>
            </div>
        </div>
    );
}

export default App;