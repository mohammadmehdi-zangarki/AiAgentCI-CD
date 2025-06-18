import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDomains } from "../../../../services/api";

const DomainIndex = () => {
    const [domains, setDomains] = useState([])

    useEffect(() => {
        const fetchDomains = async () => {
            try {
                const domains = await getDomains();

                setDomains(domains.data)
            } catch (err) {

            }
        }

        fetchDomains()
    }, [])

    return (
        <>

            <div className="flex gap-2">
                {domains.map((domain) => (
                    <Link
                        key={domain.id}
                        to={`/document/domain/${domain.id}`}
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-700"
                    >
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                                {domain.domain}
                            </h3>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                {domain.document_count} فایل
                            </span>
                        </div>
                        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                            <p>تاریخ ایجاد: {new Date(domain.created_at).toLocaleString('fa-IR')}</p>
                        </div>
                    </Link>
                ))}
            </div>
        </>
    )
}

export default DomainIndex;