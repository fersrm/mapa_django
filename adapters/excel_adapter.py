import pandas as pd
from unidecode import unidecode
from django.conf import settings
import os


class ExcelAdapter:
    def clean_text(self, x):
        """Clean and normalize text data."""
        if isinstance(x, str):
            return unidecode(x.upper().strip())
        return x

    def process_excel_file(self, document):
        """Process the uploaded Excel file and create JSON."""
        # Leer el archivo Excel y seleccionar las columnas
        df = pd.read_excel(document, sheet_name="Base benef externos 2023")
        df = df[
            [
                "INICIATIVA_NOMBRE",
                "ACCION_NOMBRE",
                "PART_TCOMUNA",
                "SEDE_UNIDAD_GESTOR",
                "BENEFICIARIO_RUT",
            ]
        ]

        # Limpiar la columna PART_TCOMUNA
        df["PART_TCOMUNA"] = df["PART_TCOMUNA"].apply(self.clean_text)

        # Filtrar los datos por SEDE_UNIDAD_GESTOR igual a 'CHILLÁN'
        df = df[df["SEDE_UNIDAD_GESTOR"] == "CHILLÁN"]

        # Agrupar y contar los registros
        result = (
            df.groupby(["INICIATIVA_NOMBRE", "ACCION_NOMBRE", "PART_TCOMUNA"])
            .size()
            .reset_index(name="COUNT")
        )

        # Definir la ruta y guardar el archivo JSON
        json_path = os.path.join(settings.MEDIA_ROOT, "json", "data.json")
        os.makedirs(os.path.dirname(json_path), exist_ok=True)
        result.to_json(json_path, orient="records", force_ascii=False)
        return json_path
