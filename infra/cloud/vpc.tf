# =====================================================================
# Topologia de red virtual para AWS - APF2 ASPEFO
#
# Este archivo describe la VPC de destino para el despliegue en la nube.
# El estado real de esta entrega es SIMULADO: la solucion se ejecuta
# en redes Docker locales (docker/compose.yaml) que reproducen el mismo
# aislamiento. La migracion a AWS se realizaria aplicando estos recursos
# con Terraform, AWS CLI o la consola, conservando el direccionamiento.
#
# Direccionamiento (CIDR) equivalente al de las redes Docker:
#   VPC 10.20.0.0/16
#     subnet publica   10.20.10.0/24   (NAT gateway, ALB, bastion)
#     subnet privada   10.20.20.0/24   (EC2 backend, RDS, NAT sin salida)
#     subnet de datos  10.20.30.0/24   (subnet group de RDS, sin ruta 0/0)
# =====================================================================

# --------------------------- Variables -------------------------------
variable "region" {
  type        = string
  description = "Region de AWS donde se despliega la plataforma."
  default     = "us-east-1"
}

variable "vpc_cidr" {
  type        = string
  description = "Rango CIDR de la VPC."
  default     = "10.20.0.0/16"
}

variable "public_subnet_cidr" {
  type        = string
  default     = "10.20.10.0/24"
}

variable "private_subnet_cidr" {
  type        = string
  default     = "10.20.20.0/24"
}

variable "data_subnet_cidr" {
  type        = string
  default     = "10.20.30.0/24"
}

variable "project" {
  type    = string
  default = "apf2-aspefo"
}

# --------------------------- VPC y subredes ---------------------------
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name    = "${var.project}-vpc"
    Project = var.project
    Stage   = "apf2"
  }
}

# Subred publica: salida a Internet yrecibe el trafico del balanceador.
resource "aws_subnet" "public" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.public_subnet_cidr
  availability_zone = "us-east-1a"

  tags = { Name = "${var.project}-subnet-public" }
}

# Subred privada: backend de aplicacion, sin IP publica.
resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidr
  availability_zone = "us-east-1b"

  tags = { Name = "${var.project}-subnet-private" }
}

# Subred de datos: reservada para el grupo de subredes de RDS.
resource "aws_subnet" "data" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.data_subnet_cidr
  availability_zone = "us-east-1a"

  tags = { Name = "${var.project}-subnet-data" }
}

# ----------------------------- Rutas --------------------------------
# Tabla de rutas publica: trafico a Internet via NAT gateway.
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "${var.project}-rt-public" }
}

# Tabla de rutas privada: solo sale a Internet a traves del NAT gateway.
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = { Name = "${var.project}-rt-private" }
}

# Tabla de rutas de datos: sin ruta por defecto (aislamiento total).
resource "aws_route_table" "data" {
  vpc_id = aws_vpc.main.id

  tags = { Name = "${var.project}-rt-data" }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "data" {
  subnet_id      = aws_subnet.data.id
  route_table_id = aws_route_table.data.id
}

# ---------------------- Internet gateway y NAT -----------------------
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags  = { Name = "${var.project}-igw" }
}

resource "aws_eip" "nat" {
  domain = "vpc"
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public.id

  tags = { Name = "${var.project}-nat" }
}
