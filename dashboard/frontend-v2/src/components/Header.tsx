import { Link, NavLink } from 'react-router-dom'

import type { QuestionMeta } from '../types'

interface HeaderProps {
  questions: QuestionMeta[]
  datasetVersion?: string
}

export function Header({ datasetVersion }: HeaderProps) {
  const getNavLinkClass = (isActive: boolean) =>
    `question-link nav-link${isActive ? ' active' : ''}`

  return (
    <header className="app-header">
      <div className="header-top">
        <Link to="/" className="brand">
          MEMORIA  RASURADA
        </Link>

        <span className="dataset-version">
          dataset: {datasetVersion ?? '-'}
        </span>
      </div>

      <nav className="question-nav app-nav" aria-label="Navegação principal">
        <NavLink
          to="/"
          end
          className={({ isActive }) => getNavLinkClass(isActive)}
        >
          Home
        </NavLink>

        <NavLink
          to="/grupos/gastos"
          className={({ isActive }) => getNavLinkClass(isActive)}
        >
          Painel de Gastos
        </NavLink>
      </nav>
    </header>
  )
}