# =====================================================================
# Grupos de seguridad - APF2 ASPEFO (AWS)
#
# Reglas de minimo privilegio. El trafico permitted es siempre el
# minimo necesario y el unico servicio con acceso publico es el
# balanceador, que solo recibe HTTP/HTTPS desde Internet.
#
# Correspondencia con el laboratorio Docker:
#   Security Group del ALB   ~  frontera publica (apf2_public)
#   Security Group del backend ~ red privada (apf2_private)
#   Security Group de la BD   ~ red privada (apf2_private)
#
# Estado: SIMULADO. En el APF2 la solucion se ejecuta en redes Docker
# locales que reproducen este aislamiento. Este archivo documenta y
# permite materializar la misma politica en una VPC de AWS.
# =====================================================================

# --------------------------- Balanceador ----------------------------
# Unico componente con acceso desde Internet.
resource "aws_security_group" "alb" {
  name        = "${var.project}-sg-alb"
  description = "ALB: unica puerta de entrada publica de la plataforma."
  vpc_id      = aws_vpc.main.id

  tags = {
    Name    = "${var.project}-sg-alb"
    Project = var.project
    Stage   = "apf2"
  }
}

resource "aws_vpc_security_group_ingress_rule" "alb_http" {
  security_group_id = aws_security_group.alb.id
  description       = "HTTP desde Internet"
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 80
  to_port           = 80
  ip_protocol       = "tcp"
}

resource "aws_vpc_security_group_ingress_rule" "alb_https" {
  security_group_id = aws_security_group.alb.id
  description       = "HTTPS desde Internet"
  cidr_ipv4         = "0.0.0.0/0"
  from_port         = 443
  to_port           = 443
  ip_protocol       = "tcp"
}

# El ALB solo acepta trafico del grupo de seguridad de si mismo.
resource "aws_vpc_security_group_egress_rule" "alb_to_backend" {
  security_group_id            = aws_security_group.alb.id
  description                  = "Salida al backend por el puerto 8080"
  referenced_security_group_id = aws_security_group.backend.id
  from_port                    = 8080
  to_port                      = 8080
  ip_protocol                  = "tcp"
}

# --------------------------- Backend --------------------------------
# Sin acceso publico: solo recibe trafico del balanceador.
resource "aws_security_group" "backend" {
  name        = "${var.project}-sg-backend"
  description = "Backend ENAO: accesible solo desde el ALB."
  vpc_id      = aws_vpc.main.id

  tags = {
    Name    = "${var.project}-sg-backend"
    Project = var.project
    Stage   = "apf2"
  }
}

resource "aws_vpc_security_group_ingress_rule" "backend_from_alb" {
  security_group_id            = aws_security_group.backend.id
  description                  = "API desde el balanceador"
  referenced_security_group_id = aws_security_group.alb.id
  from_port                    = 8080
  to_port                      = 8080
  ip_protocol                  = "tcp"
}

resource "aws_vpc_security_group_egress_rule" "backend_to_db" {
  security_group_id            = aws_security_group.backend.id
  description                  = "Acceso a la base de datos"
  referenced_security_group_id = aws_security_group.database.id
  from_port                    = 3306
  to_port                      = 3306
  ip_protocol                  = "tcp"
}

# --------------------------- Base de datos ---------------------------
# Sin acceso publico y sin salida a Internet.
resource "aws_security_group" "database" {
  name        = "${var.project}-sg-db"
  description = "MySQL/RDS: solo alcanzable desde el backend."
  vpc_id      = aws_vpc.main.id

  tags = {
    Name    = "${var.project}-sg-db"
    Project = var.project
    Stage   = "apf2"
  }
}

resource "aws_vpc_security_group_ingress_rule" "db_from_backend" {
  security_group_id            = aws_security_group.database.id
  description                  = "MySQL desde el backend"
  referenced_security_group_id = aws_security_group.backend.id
  from_port                    = 3306
  to_port                      = 3306
  ip_protocol                  = "tcp"
}

# Sin reglas de salida: la base de datos no inicia conexiones.
