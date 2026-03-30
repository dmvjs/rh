import { renderHeader, renderFooter, requireAuth } from './header.js'
import { api } from './api.js'

// 200 neighborhood addresses with WGS84 coordinates from Fairfax County GIS
const ADDRESSES = [
  { address: '3700 MILLBANK CT', display: '3700 Millbank Ct', lat: 38.844197, lng: -77.250821 },
  { address: '3700 MOSS BROOKE CT', display: '3700 Moss Brooke Ct', lat: 38.845439, lng: -77.254054 },
  { address: '3700 RIDGELEA DR', display: '3700 Ridgelea Dr', lat: 38.844672, lng: -77.25008 },
  { address: '3701 MOSS BROOKE CT', display: '3701 Moss Brooke Ct', lat: 38.845395, lng: -77.253681 },
  { address: '3701 RIDGELEA DR', display: '3701 Ridgelea Dr', lat: 38.844767, lng: -77.249799 },
  { address: '3702 MOSS BROOKE CT', display: '3702 Moss Brooke Ct', lat: 38.845186, lng: -77.254131 },
  { address: '3703 MILLBANK CT', display: '3703 Millbank Ct', lat: 38.844183, lng: -77.250474 },
  { address: '3703 MOSS BROOKE CT', display: '3703 Moss Brooke Ct', lat: 38.845134, lng: -77.253616 },
  { address: '3703 RIDGELEA DR', display: '3703 Ridgelea Dr', lat: 38.844935, lng: -77.249126 },
  { address: '3705 MILLBANK CT', display: '3705 Millbank Ct', lat: 38.843904, lng: -77.250559 },
  { address: '3705 MOSS BROOKE CT', display: '3705 Moss Brooke Ct', lat: 38.844885, lng: -77.253441 },
  { address: '3705 RIDGELEA DR', display: '3705 Ridgelea Dr', lat: 38.844703, lng: -77.249249 },
  { address: '3706 MOSS BROOKE CT', display: '3706 Moss Brooke Ct', lat: 38.844888, lng: -77.254159 },
  { address: '3706 RIDGELEA DR', display: '3706 Ridgelea Dr', lat: 38.844505, lng: -77.250437 },
  { address: '3707 MILLBANK CT', display: '3707 Millbank Ct', lat: 38.843655, lng: -77.250698 },
  { address: '3707 MOSS BROOKE CT', display: '3707 Moss Brooke Ct', lat: 38.844645, lng: -77.253551 },
  { address: '3707 RIDGELEA DR', display: '3707 Ridgelea Dr', lat: 38.844451, lng: -77.249308 },
  { address: '3708 MILLBANK CT', display: '3708 Millbank Ct', lat: 38.844148, lng: -77.251101 },
  { address: '3708 MOSS BROOKE CT', display: '3708 Moss Brooke Ct', lat: 38.844642, lng: -77.254212 },
  { address: '3709 MILLBANK CT', display: '3709 Millbank Ct', lat: 38.843562, lng: -77.251029 },
  { address: '3710 MILLBANK CT', display: '3710 Millbank Ct', lat: 38.843992, lng: -77.251375 },
  { address: '3710 RIDGELEA DR', display: '3710 Ridgelea Dr', lat: 38.844344, lng: -77.250003 },
  { address: '3711 MILLBANK CT', display: '3711 Millbank Ct', lat: 38.843509, lng: -77.251381 },
  { address: '3711 RIDGELEA DR', display: '3711 Ridgelea Dr', lat: 38.84422, lng: -77.249409 },
  { address: '3712 MILLBANK CT', display: '3712 Millbank Ct', lat: 38.843898, lng: -77.251649 },
  { address: '3712 RIDGELEA DR', display: '3712 Ridgelea Dr', lat: 38.844126, lng: -77.250078 },
  { address: '3713 MILLBANK CT', display: '3713 Millbank Ct', lat: 38.843379, lng: -77.251677 },
  { address: '3713 RIDGELEA DR', display: '3713 Ridgelea Dr', lat: 38.843965, lng: -77.249572 },
  { address: '3714 RIDGELEA DR', display: '3714 Ridgelea Dr', lat: 38.843906, lng: -77.250156 },
  { address: '3715 RIDGELEA DR', display: '3715 Ridgelea Dr', lat: 38.843674, lng: -77.249664 },
  { address: '3716 RIDGELEA DR', display: '3716 Ridgelea Dr', lat: 38.843679, lng: -77.250253 },
  { address: '3717 RIDGELEA DR', display: '3717 Ridgelea Dr', lat: 38.843412, lng: -77.249762 },
  { address: '3718 RIDGELEA DR', display: '3718 Ridgelea Dr', lat: 38.843429, lng: -77.250383 },
  { address: '3722 RIDGELEA DR', display: '3722 Ridgelea Dr', lat: 38.843316, lng: -77.25057 },
  { address: '3724 RIDGELEA DR', display: '3724 Ridgelea Dr', lat: 38.843248, lng: -77.250875 },
  { address: '3725 RIDGELEA DR', display: '3725 Ridgelea Dr', lat: 38.842823, lng: -77.250762 },
  { address: '3726 RIDGELEA DR', display: '3726 Ridgelea Dr', lat: 38.843201, lng: -77.251178 },
  { address: '3799 GLENBROOK RD', display: '3799 Glenbrook Rd', lat: 38.844599, lng: -77.254711 },
  { address: '3800 MOSS BROOKE CT', display: '3800 Moss Brooke Ct', lat: 38.844367, lng: -77.25422 },
  { address: '3800 RIDGELEA DR', display: '3800 Ridgelea Dr', lat: 38.84284, lng: -77.252002 },
  { address: '3800 SANDALWOOD CT', display: '3800 Sandalwood Ct', lat: 38.842855, lng: -77.250435 },
  { address: '3801 GLENBROOK RD', display: '3801 Glenbrook Rd', lat: 38.844612, lng: -77.255482 },
  { address: '3801 SANDALWOOD CT', display: '3801 Sandalwood Ct', lat: 38.843127, lng: -77.24991 },
  { address: '3802 MOSS BROOKE CT', display: '3802 Moss Brooke Ct', lat: 38.844102, lng: -77.254269 },
  { address: '3802 RIDGELEA DR', display: '3802 Ridgelea Dr', lat: 38.842652, lng: -77.252229 },
  { address: '3802 SANDALWOOD CT', display: '3802 Sandalwood Ct', lat: 38.84257, lng: -77.250146 },
  { address: '3803 MOSS BROOKE CT', display: '3803 Moss Brooke Ct', lat: 38.843924, lng: -77.253738 },
  { address: '3803 RIDGELEA DR', display: '3803 Ridgelea Dr', lat: 38.842294, lng: -77.251807 },
  { address: '3803 SANDALWOOD CT', display: '3803 Sandalwood Ct', lat: 38.84284, lng: -77.24971 },
  { address: '3804 MOSS BROOKE CT', display: '3804 Moss Brooke Ct', lat: 38.843822, lng: -77.254321 },
  { address: '3805 MOSS BROOKE CT', display: '3805 Moss Brooke Ct', lat: 38.843664, lng: -77.253771 },
  { address: '3805 RIDGELEA DR', display: '3805 Ridgelea Dr', lat: 38.842094, lng: -77.251998 },
  { address: '3805 SANDALWOOD CT', display: '3805 Sandalwood Ct', lat: 38.842639, lng: -77.249498 },
  { address: '3806 MOSS BROOKE CT', display: '3806 Moss Brooke Ct', lat: 38.843536, lng: -77.254348 },
  { address: '3806 RIDGELEA DR', display: '3806 Ridgelea Dr', lat: 38.842252, lng: -77.252616 },
  { address: '3806 SANDALWOOD CT', display: '3806 Sandalwood Ct', lat: 38.842351, lng: -77.249967 },
  { address: '3807 GLENBROOK RD', display: '3807 Glenbrook Rd', lat: 38.84424, lng: -77.255561 },
  { address: '3807 MOSS BROOKE CT', display: '3807 Moss Brooke Ct', lat: 38.843405, lng: -77.253703 },
  { address: '3807 SANDALWOOD CT', display: '3807 Sandalwood Ct', lat: 38.842407, lng: -77.249314 },
  { address: '3808 MOSS BROOKE CT', display: '3808 Moss Brooke Ct', lat: 38.843286, lng: -77.254393 },
  { address: '3808 RIDGELEA DR', display: '3808 Ridgelea Dr', lat: 38.842046, lng: -77.252748 },
  { address: '3808 SANDALWOOD CT', display: '3808 Sandalwood Ct', lat: 38.842147, lng: -77.249772 },
  { address: '3809 MOSS BROOKE CT', display: '3809 Moss Brooke Ct', lat: 38.843146, lng: -77.253677 },
  { address: '3809 SANDALWOOD CT', display: '3809 Sandalwood Ct', lat: 38.842145, lng: -77.249152 },
  { address: '3810 MOSS BROOKE CT', display: '3810 Moss Brooke Ct', lat: 38.843042, lng: -77.254276 },
  { address: '3810 RIDGELEA DR', display: '3810 Ridgelea Dr', lat: 38.841807, lng: -77.252867 },
  { address: '3810 SANDALWOOD CT', display: '3810 Sandalwood Ct', lat: 38.841842, lng: -77.249625 },
  { address: '3811 GLENBROOK RD', display: '3811 Glenbrook Rd', lat: 38.843928, lng: -77.255803 },
  { address: '3811 MOSS BROOKE CT', display: '3811 Moss Brooke Ct', lat: 38.842975, lng: -77.253949 },
  { address: '3811 SANDALWOOD CT', display: '3811 Sandalwood Ct', lat: 38.841869, lng: -77.249066 },
  { address: '3812 RIDGELEA DR', display: '3812 Ridgelea Dr', lat: 38.841543, lng: -77.252966 },
  { address: '3812 SANDALWOOD CT', display: '3812 Sandalwood Ct', lat: 38.84153, lng: -77.249649 },
  { address: '3813 SANDALWOOD CT', display: '3813 Sandalwood Ct', lat: 38.841586, lng: -77.249053 },
  { address: '3814 RIDGELEA DR', display: '3814 Ridgelea Dr', lat: 38.841305, lng: -77.253081 },
  { address: '3815 SANDALWOOD CT', display: '3815 Sandalwood Ct', lat: 38.841313, lng: -77.249028 },
  { address: '3816 RIDGELEA DR', display: '3816 Ridgelea Dr', lat: 38.841033, lng: -77.253185 },
  { address: '3817 GLENBROOK RD', display: '3817 Glenbrook Rd', lat: 38.84367, lng: -77.255657 },
  { address: '3819 GLENBROOK RD', display: '3819 Glenbrook Rd', lat: 38.843389, lng: -77.25495 },
  { address: '3823 GLENBROOK RD', display: '3823 Glenbrook Rd', lat: 38.843023, lng: -77.255668 },
  { address: '3827 GLENBROOK RD', display: '3827 Glenbrook Rd', lat: 38.842669, lng: -77.255797 },
  { address: '3831 GLENBROOK RD', display: '3831 Glenbrook Rd', lat: 38.842349, lng: -77.255977 },
  { address: '3841 GLENBROOK RD', display: '3841 Glenbrook Rd', lat: 38.841784, lng: -77.255355 },
  { address: '3900 RIDGELEA DR', display: '3900 Ridgelea Dr', lat: 38.8408, lng: -77.253281 },
  { address: '3900 SANDALWOOD CT', display: '3900 Sandalwood Ct', lat: 38.84099, lng: -77.249594 },
  { address: '3901 BENTWOOD CT', display: '3901 Bentwood Ct', lat: 38.842252, lng: -77.253483 },
  { address: '3901 GLENBROOK RD', display: '3901 Glenbrook Rd', lat: 38.84141, lng: -77.256147 },
  { address: '3901 SANDALWOOD CT', display: '3901 Sandalwood Ct', lat: 38.841076, lng: -77.249012 },
  { address: '3902 LARO CT', display: '3902 Laro Ct', lat: 38.841368, lng: -77.249997 },
  { address: '3902 RIDGELEA DR', display: '3902 Ridgelea Dr', lat: 38.840571, lng: -77.253383 },
  { address: '3902 SANDALWOOD CT', display: '3902 Sandalwood Ct', lat: 38.840713, lng: -77.249553 },
  { address: '3903 BENTWOOD CT', display: '3903 Bentwood Ct', lat: 38.842242, lng: -77.253129 },
  { address: '3903 GLENBROOK RD', display: '3903 Glenbrook Rd', lat: 38.841275, lng: -77.255321 },
  { address: '3903 LARO CT', display: '3903 Laro Ct', lat: 38.840914, lng: -77.249911 },
  { address: '3903 RIDGELEA DR', display: '3903 Ridgelea Dr', lat: 38.840468, lng: -77.252802 },
  { address: '3903 SANDALWOOD CT', display: '3903 Sandalwood Ct', lat: 38.840803, lng: -77.249039 },
  { address: '3904 LARO CT', display: '3904 Laro Ct', lat: 38.840838, lng: -77.250575 },
  { address: '3904 RIDGELEA DR', display: '3904 Ridgelea Dr', lat: 38.840323, lng: -77.253451 },
  { address: '3904 SANDALWOOD CT', display: '3904 Sandalwood Ct', lat: 38.840464, lng: -77.249573 },
  { address: '3905 BENTWOOD CT', display: '3905 Bentwood Ct', lat: 38.841954, lng: -77.253242 },
  { address: '3905 LARO CT', display: '3905 Laro Ct', lat: 38.840692, lng: -77.250059 },
  { address: '3905 RIDGELEA DR', display: '3905 Ridgelea Dr', lat: 38.840235, lng: -77.252862 },
  { address: '3905 SANDALWOOD CT', display: '3905 Sandalwood Ct', lat: 38.840545, lng: -77.249014 },
  { address: '3906 LARO CT', display: '3906 Laro Ct', lat: 38.840612, lng: -77.250705 },
  { address: '3906 SANDALWOOD CT', display: '3906 Sandalwood Ct', lat: 38.840206, lng: -77.249574 },
  { address: '3907 BENTWOOD CT', display: '3907 Bentwood Ct', lat: 38.841725, lng: -77.25333 },
  { address: '3907 LARO CT', display: '3907 Laro Ct', lat: 38.840433, lng: -77.250174 },
  { address: '3907 RIDGELEA DR', display: '3907 Ridgelea Dr', lat: 38.84, lng: -77.253006 },
  { address: '3907 SANDALWOOD CT', display: '3907 Sandalwood Ct', lat: 38.840274, lng: -77.24898 },
  { address: '3908 LARO CT', display: '3908 Laro Ct', lat: 38.840349, lng: -77.250755 },
  { address: '3908 SANDALWOOD CT', display: '3908 Sandalwood Ct', lat: 38.839954, lng: -77.249592 },
  { address: '3909 BENTWOOD CT', display: '3909 Bentwood Ct', lat: 38.841508, lng: -77.253431 },
  { address: '3909 GLENBROOK RD', display: '3909 Glenbrook Rd', lat: 38.840944, lng: -77.256212 },
  { address: '3909 LARO CT', display: '3909 Laro Ct', lat: 38.840177, lng: -77.250286 },
  { address: '3909 RIDGELEA DR', display: '3909 Ridgelea Dr', lat: 38.839715, lng: -77.253111 },
  { address: '3909 SANDALWOOD CT', display: '3909 Sandalwood Ct', lat: 38.84, lng: -77.248927 },
  { address: '3910 BENTWOOD CT', display: '3910 Bentwood Ct', lat: 38.841561, lng: -77.254077 },
  { address: '3910 LARO CT', display: '3910 Laro Ct', lat: 38.840109, lng: -77.250956 },
  { address: '3910 RIDGELEA DR', display: '3910 Ridgelea Dr', lat: 38.839614, lng: -77.253772 },
  { address: '3910 SANDALWOOD CT', display: '3910 Sandalwood Ct', lat: 38.839672, lng: -77.249542 },
  { address: '3911 BENTWOOD CT', display: '3911 Bentwood Ct', lat: 38.841267, lng: -77.253536 },
  { address: '3911 LARO CT', display: '3911 Laro Ct', lat: 38.840018, lng: -77.249956 },
  { address: '3911 SANDALWOOD CT', display: '3911 Sandalwood Ct', lat: 38.839737, lng: -77.24893 },
  { address: '3912 BENTWOOD CT', display: '3912 Bentwood Ct', lat: 38.841352, lng: -77.254155 },
  { address: '3912 LARO CT', display: '3912 Laro Ct', lat: 38.839855, lng: -77.251093 },
  { address: '3913 BENTWOOD CT', display: '3913 Bentwood Ct', lat: 38.841035, lng: -77.253576 },
  { address: '3913 LARO CT', display: '3913 Laro Ct', lat: 38.839764, lng: -77.249996 },
  { address: '3913 RIDGELEA DR', display: '3913 Ridgelea Dr', lat: 38.839438, lng: -77.253219 },
  { address: '3913 SANDALWOOD CT', display: '3913 Sandalwood Ct', lat: 38.83961, lng: -77.249221 },
  { address: '3914 BENTWOOD CT', display: '3914 Bentwood Ct', lat: 38.841112, lng: -77.254215 },
  { address: '3915 BENTWOOD CT', display: '3915 Bentwood Ct', lat: 38.840808, lng: -77.253716 },
  { address: '3915 GLENBROOK RD', display: '3915 Glenbrook Rd', lat: 38.840538, lng: -77.256263 },
  { address: '3915 LARO CT', display: '3915 Laro Ct', lat: 38.839784, lng: -77.250375 },
  { address: '3916 BENTWOOD CT', display: '3916 Bentwood Ct', lat: 38.840876, lng: -77.254294 },
  { address: '3917 BENTWOOD CT', display: '3917 Bentwood Ct', lat: 38.84056, lng: -77.253798 },
  { address: '3917 LARO CT', display: '3917 Laro Ct', lat: 38.839721, lng: -77.250753 },
  { address: '3918 BENTWOOD CT', display: '3918 Bentwood Ct', lat: 38.840644, lng: -77.254418 },
  { address: '3919 BENTWOOD CT', display: '3919 Bentwood Ct', lat: 38.840302, lng: -77.253901 },
  { address: '3920 BENTWOOD CT', display: '3920 Bentwood Ct', lat: 38.840398, lng: -77.254503 },
  { address: '3922 BENTWOOD CT', display: '3922 Bentwood Ct', lat: 38.84014, lng: -77.25449 },
  { address: '3924 BENTWOOD CT', display: '3924 Bentwood Ct', lat: 38.839925, lng: -77.254339 },
  { address: '3926 BENTWOOD CT', display: '3926 Bentwood Ct', lat: 38.83971, lng: -77.254067 },
  { address: '3927 BENTWOOD CT', display: '3927 Bentwood Ct', lat: 38.840094, lng: -77.253558 },
  { address: '3935 GLENBROOK RD', display: '3935 Glenbrook Rd', lat: 38.840286, lng: -77.256258 },
  { address: '8721 GLENBROOK PL', display: '8721 Glenbrook Pl', lat: 38.844505, lng: -77.24712 },
  { address: '8730 GLENBROOK PL', display: '8730 Glenbrook Pl', lat: 38.844937, lng: -77.247961 },
  { address: '8731 GLENBROOK PL', display: '8731 Glenbrook Pl', lat: 38.844301, lng: -77.247882 },
  { address: '8732 GLENBROOK PL', display: '8732 Glenbrook Pl', lat: 38.844551, lng: -77.248186 },
  { address: '8800 GLADE HILL RD', display: '8800 Glade Hill Rd', lat: 38.842088, lng: -77.250578 },
  { address: '8800 SANDY RIDGE CT', display: '8800 Sandy Ridge Ct', lat: 38.841427, lng: -77.250807 },
  { address: '8800 SOUTHLEA CT', display: '8800 Southlea Ct', lat: 38.840658, lng: -77.251112 },
  { address: '8801 GLADE HILL RD', display: '8801 Glade Hill Rd', lat: 38.841993, lng: -77.250923 },
  { address: '8801 SANDY RIDGE CT', display: '8801 Sandy Ridge Ct', lat: 38.841122, lng: -77.250935 },
  { address: '8801 SOUTHLEA CT', display: '8801 Southlea Ct', lat: 38.840415, lng: -77.251415 },
  { address: '8802 GLADE HILL RD', display: '8802 Glade Hill Rd', lat: 38.842359, lng: -77.25054 },
  { address: '8802 SANDY RIDGE CT', display: '8802 Sandy Ridge Ct', lat: 38.84173, lng: -77.250844 },
  { address: '8802 SOUTHLEA CT', display: '8802 Southlea Ct', lat: 38.84077, lng: -77.251404 },
  { address: '8803 GLADE HILL RD', display: '8803 Glade Hill Rd', lat: 38.842068, lng: -77.251227 },
  { address: '8803 SANDY RIDGE CT', display: '8803 Sandy Ridge Ct', lat: 38.841156, lng: -77.251166 },
  { address: '8803 SOUTHLEA CT', display: '8803 Southlea Ct', lat: 38.840524, lng: -77.251701 },
  { address: '8804 GLADE HILL RD', display: '8804 Glade Hill Rd', lat: 38.842562, lng: -77.250848 },
  { address: '8804 SANDY RIDGE CT', display: '8804 Sandy Ridge Ct', lat: 38.841773, lng: -77.251247 },
  { address: '8804 SOUTHLEA CT', display: '8804 Southlea Ct', lat: 38.841017, lng: -77.251494 },
  { address: '8805 GLADE HILL RD', display: '8805 Glade Hill Rd', lat: 38.842274, lng: -77.251428 },
  { address: '8805 SANDY RIDGE CT', display: '8805 Sandy Ridge Ct', lat: 38.841326, lng: -77.25148 },
  { address: '8805 SOUTHLEA CT', display: '8805 Southlea Ct', lat: 38.840562, lng: -77.252027 },
  { address: '8806 GLADE HILL RD', display: '8806 Glade Hill Rd', lat: 38.842746, lng: -77.251123 },
  { address: '8806 SANDY RIDGE CT', display: '8806 Sandy Ridge Ct', lat: 38.841887, lng: -77.251538 },
  { address: '8806 SOUTHLEA CT', display: '8806 Southlea Ct', lat: 38.841087, lng: -77.251874 },
  { address: '8807 GLADE HILL RD', display: '8807 Glade Hill Rd', lat: 38.842473, lng: -77.251593 },
  { address: '8807 SANDY RIDGE CT', display: '8807 Sandy Ridge Ct', lat: 38.841398, lng: -77.251781 },
  { address: '8807 SOUTHLEA CT', display: '8807 Southlea Ct', lat: 38.840623, lng: -77.252323 },
  { address: '8808 SANDY RIDGE CT', display: '8808 Sandy Ridge Ct', lat: 38.841825, lng: -77.251852 },
  { address: '8808 SOUTHLEA CT', display: '8808 Southlea Ct', lat: 38.841144, lng: -77.252246 },
  { address: '8809 SANDY RIDGE CT', display: '8809 Sandy Ridge Ct', lat: 38.841398, lng: -77.252112 },
  { address: '8809 SOUTHLEA CT', display: '8809 Southlea Ct', lat: 38.840704, lng: -77.252678 },
  { address: '8810 SANDY RIDGE CT', display: '8810 Sandy Ridge Ct', lat: 38.841868, lng: -77.252193 },
  { address: '8810 SOUTHLEA CT', display: '8810 Southlea Ct', lat: 38.841184, lng: -77.252514 },
  { address: '8811 SANDY RIDGE CT', display: '8811 Sandy Ridge Ct', lat: 38.841427, lng: -77.252429 },
  { address: '8900 GLADE HILL RD', display: '8900 Glade Hill Rd', lat: 38.843131, lng: -77.251495 },
  { address: '8903 AUTUMN LEAF CT', display: '8903 Autumn Leaf Ct', lat: 38.842441, lng: -77.252842 },
  { address: '8903 GLADE HILL RD', display: '8903 Glade Hill Rd', lat: 38.843081, lng: -77.252139 },
  { address: '8904 AUTUMN LEAF CT', display: '8904 Autumn Leaf Ct', lat: 38.842811, lng: -77.252397 },
  { address: '8905 AUTUMN LEAF CT', display: '8905 Autumn Leaf Ct', lat: 38.842638, lng: -77.25303 },
  { address: '8905 GLADE HILL RD', display: '8905 Glade Hill Rd', lat: 38.843296, lng: -77.252315 },
  { address: '8906 AUTUMN LEAF CT', display: '8906 Autumn Leaf Ct', lat: 38.843055, lng: -77.252531 },
  { address: '8906 GLADE HILL RD', display: '8906 Glade Hill Rd', lat: 38.84378, lng: -77.251975 },
  { address: '8907 GLADE HILL RD', display: '8907 Glade Hill Rd', lat: 38.843523, lng: -77.252455 },
  { address: '8908 AUTUMN LEAF CT', display: '8908 Autumn Leaf Ct', lat: 38.843407, lng: -77.252776 },
  { address: '8908 GLADE HILL RD', display: '8908 Glade Hill Rd', lat: 38.843994, lng: -77.252134 },
  { address: '8909 GLADE HILL RD', display: '8909 Glade Hill Rd', lat: 38.843736, lng: -77.252598 },
  { address: '8910 AUTUMN LEAF CT', display: '8910 Autumn Leaf Ct', lat: 38.843176, lng: -77.25299 },
  { address: '8910 GLADE HILL RD', display: '8910 Glade Hill Rd', lat: 38.844183, lng: -77.25227 },
  { address: '8911 GLADE HILL RD', display: '8911 Glade Hill Rd', lat: 38.843926, lng: -77.252782 },
  { address: '8913 GLADE HILL RD', display: '8913 Glade Hill Rd', lat: 38.844125, lng: -77.252956 },
  { address: '8917 GLADE HILL RD', display: '8917 Glade Hill Rd', lat: 38.844192, lng: -77.253673 },
  { address: '9000 GLENBROOK CT', display: '9000 Glenbrook Ct', lat: 38.845749, lng: -77.254663 },
  { address: '9001 GLENBROOK CT', display: '9001 Glenbrook Ct', lat: 38.845159, lng: -77.254483 },
  { address: '9002 GLENBROOK CT', display: '9002 Glenbrook Ct', lat: 38.845501, lng: -77.25518 },
  { address: '9003 GLENBROOK CT', display: '9003 Glenbrook Ct', lat: 38.845054, lng: -77.255282 },
  { address: '9004 GLENBROOK CT', display: '9004 Glenbrook Ct', lat: 38.845535, lng: -77.255592 },
]

// Normalize an address string for matching:
// uppercase, strip city/state suffix, expand abbreviations, collapse spaces
function normalizeAddr(s) {
  return String(s ?? '')
    .toUpperCase()
    .replace(/,.*$/, '')
    .replace(/\bCOURT\b/g, 'CT')
    .replace(/\bDRIVE\b/g, 'DR')
    .replace(/\bROAD\b/g, 'RD')
    .replace(/\bPLACE\b/g, 'PL')
    .replace(/\bLANE\b/g, 'LN')
    .replace(/\bAVENUE\b/g, 'AVE')
    .replace(/\bSTREET\b/g, 'ST')
    .replace(/\bTERRACE\b/g, 'TER')
    .replace(/\s+/g, ' ')
    .trim()
}

function escHtml(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function init() {
  await Promise.all([
    renderHeader(document.getElementById('site-header')),
    renderFooter(document.getElementById('site-footer')),
  ])

  const user = await requireAuth()
  if (!user) return

  const isAdmin = user.role === 'admin' || user.role === 'moderator'

  document.querySelector('main').style.visibility = ''

  const map = L.map('neighbor-map').setView([38.8425, -77.2525], 17)

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(map)

  // Load trusted emails for admin matching
  let trustedList = []
  if (isAdmin) {
    const { trusted = [] } = await api.get('/api/admin/trusted-emails').catch(() => ({ trusted: [] }))
    trustedList = trusted.filter(t => t.address).map(t => ({
      email: t.email,
      _norm: normalizeAddr(t.address),
    }))
  }

  // Match trusted emails to a canonical address using prefix matching:
  // "3902 LARO CT FALLS CHURCH VA" starts with "3902 LARO CT" → match
  function residentsFor(canonicalAddr) {
    const canon = normalizeAddr(canonicalAddr)
    return trustedList.filter(t => t._norm === canon || t._norm.startsWith(canon + ' '))
  }

  let registeredCount = 0

  for (const a of ADDRESSES) {
    const residents = isAdmin ? residentsFor(a.address) : []
    const hasResident = isAdmin && residents.length > 0

    if (hasResident) registeredCount++

    const marker = L.circleMarker([a.lat, a.lng], {
      radius:      hasResident ? 7 : 5,
      color:       hasResident ? '#2a7a3b' : '#888',
      fillColor:   hasResident ? '#4caf50' : '#bbb',
      fillOpacity: hasResident ? 0.9 : 0.5,
      weight:      hasResident ? 2 : 1,
    }).addTo(map)

    if (isAdmin && residents.length > 0) {
      const emailLinks = residents.map(r => {
        const email = escHtml(r.email || '')
        return `<div style="margin-top:4px;">
          <a href="mailto:${email}" style="color:#2a7a3b;font-size:.85rem;">${email}</a>
        </div>`
      }).join('')
      marker.bindPopup(`
        <strong>${escHtml(a.display)}</strong>
        ${emailLinks}
      `, { minWidth: 180 })
    } else {
      marker.bindTooltip(a.display, { permanent: false, direction: 'top' })
      marker.bindPopup(`<strong>${escHtml(a.display)}</strong>`)
    }
  }

  // Legend
  const legendEl = document.getElementById('map-legend')
  if (isAdmin) {
    legendEl.innerHTML = `
      <span class="map-legend-item">
        <span class="map-legend-dot" style="background:#4caf50;border-color:#2a7a3b;"></span>
        ${registeredCount} registered
      </span>
      <span class="map-legend-item">
        <span class="map-legend-dot" style="background:#bbb;border-color:#888;"></span>
        ${ADDRESSES.length - registeredCount} unregistered
      </span>
    `
  } else {
    legendEl.innerHTML = `
      <span class="map-legend-item">
        <span class="map-legend-dot" style="background:#bbb;border-color:#888;"></span>
        ${ADDRESSES.length} neighborhood addresses
      </span>
    `
  }
}

init()
