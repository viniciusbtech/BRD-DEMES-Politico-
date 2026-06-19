import subprocess
from pathlib import Path
import shutil
import sys

def main():
    print("Exporting answers from database and generating artifacts...")
    
    questoes_dir = Path("questoes")

    # 1. Clean up Banco/respostas/ directory
    banco_respostas_dir = Path("Banco/respostas")
    banco_respostas_dir.mkdir(parents=True, exist_ok=True)
    for ext in ("*.txt", "*.csv"):
        for file_path in banco_respostas_dir.glob(ext):
            try:
                file_path.unlink()
            except Exception as e:
                print(f"Error removing {file_path}: {e}")
        
    # 2. Run SQL queries in Postgres container
    queries = {
        "q1": questoes_dir / "q1" / "consultas" / "q1.sql",
        "q3": questoes_dir / "q3" / "consultas" / "q3.sql",
        "q4": questoes_dir / "q4" / "consultas" / "q4.sql",
        "q5": questoes_dir / "q5" / "consultas" / "q5.sql",
        "q13": questoes_dir / "q13" / "consultas" / "q13.sql",
        "q9": questoes_dir / "q9" / "consultas" / "q9.sql",
        "q10": questoes_dir / "q10" / "consultas" / "q10.sql",
        "q11": questoes_dir / "q11" / "consultas" / "q11.sql",
    }
    
    for name, sql_path in queries.items():
        if not sql_path.exists():
            print(f"Warning: {sql_path} does not exist. Skipping.")
            continue
            
        print(f"Running database query {name} from {sql_path} in container...")
        try:
            sql_content = sql_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            sql_content = sql_path.read_text(encoding="latin-1")
        
        # Prepend schema and client encoding (latin1) to match expected formats
        config = "SET search_path TO grupo4; SET client_encoding TO 'UTF8';\n"
        full_sql = config + sql_content
        
        # Execute inside docker container
        try:
            subprocess.run(
                ["docker", "exec", "-i", "bdr-postgres", "psql", "-U", "admin", "-d", "dossie_grupo4", "-f", "-"],
                input=full_sql,
                text=True,
                check=True
            )
            print(f"Query {name} completed successfully.")
        except subprocess.CalledProcessError as exc:
            print(f"Error running query {name}: {exc}")
            sys.exit(1)
            
    # 3. Run Q2 python script locally
    q2_script = Path("dashboard/scripts/generate_q2_artifacts.py")
    if q2_script.exists():
        print("\nRunning Q2 python artifact generator locally...")
        try:
            subprocess.run(
                [sys.executable, str(q2_script), "--all"],
                check=True
            )
            print("Q2 python artifact generator completed successfully.")
        except subprocess.CalledProcessError as exc:
            print(f"Error running Q2 generator script: {exc}")
            sys.exit(1)
    else:
        print(f"\nWarning: Q2 script {q2_script} not found.")

    # 4. Copy Q1 and Q4 response files to destination folders
    # Note: Q2 files are already written to targets by the Q2 generator script
    targets = {
        "q1_gastos_deputados.txt": [
            questoes_dir / "q1" / "respostas" / "q1_gastos_deputados.txt",
        ],
        "q3_voto_deputado_tema.txt": [
            questoes_dir / "q3" / "respostas" / "q3_voto_deputado_tema.txt",
        ],        
        "q4_escolaridade.txt": [
            questoes_dir / "q4" / "respostas" / "q4_escolaridade.txt",
        ],
        "q4_escolaridade_complementar.txt": [
            questoes_dir / "q4" / "respostas" / "q4_escolaridade_complementar.txt",
        ],
        "q5_fornecedores.txt": [
            questoes_dir / "q5" / "respostas" / "q5_fornecedores.txt",
        ],
        "q5_fornecedores_complemento.txt": [
            questoes_dir / "q5" / "respostas" / "q5_fornecedores_complemento.txt",
        ],
        "q13_categorias_gasto_deputado.txt": [
            questoes_dir / "q13" / "respostas" / "q13_categorias_gasto_deputado.txt",
        ],
        "q13_categorias_gasto_deputado_complemento.txt": [
            questoes_dir / "q13" / "respostas" / "q13_categorias_gasto_deputado_complemento.txt",
        ],
        "q9_vies_deputado.txt": [
            questoes_dir / "q9" / "respostas" / "q9_vies_deputado.txt",
        ],
        "q9_vies_deputado_detalhe.csv": [
            questoes_dir / "q9" / "respostas" / "q9_vies_deputado_detalhe.csv",
        ],
        "q10_alinhamento_partidos.txt": [
            questoes_dir / "q10" / "respostas" / "q10_alinhamento_partidos.txt",
        ],
        "q11_ranking_partidos.txt": [
            questoes_dir / "q11" / "respostas" / "q11_ranking_partidos.txt",
        ],
    }
    
    print("\nCopying response files to destination folders...")
    for filename, dest_paths in targets.items():
        src_file = banco_respostas_dir / filename
        if not src_file.exists():
            print(f"Warning: Expected output file {src_file} was not generated!")
            continue
            
        for dest_path in dest_paths:
            try:
                dest_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(src_file, dest_path)
                print(f"Copied {src_file.name} to {dest_path}")
            except Exception as exc:
                print(f"Error copying {src_file.name} to {dest_path}: {exc}")
            
    print("\nExport and generation completed successfully!")

if __name__ == "__main__":
    main()
